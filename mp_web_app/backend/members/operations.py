import csv
import io
import os
from typing import Any

from botocore.exceptions import ClientError
from starlette.datastructures import UploadFile

from database.exceptions import DatabaseError
from database.repositories import MemberRepository
from members.exceptions import InvalidFileTypeError, MemberNotFoundError, ValidationError
from members.models import Member, MemberUpdate
from users.operations import validate_email, validate_phone

MEMBERS_TABLE_NAME = os.environ.get("MEMBERS_TABLE_NAME")


def get_member_repository() -> MemberRepository:
  """Dependency to get the member repository."""
  return MemberRepository(MEMBERS_TABLE_NAME)


def is_member_code_valid(member_code: str, repo: MemberRepository) -> Member | None:
  response = repo.table.get_item(Key={"member_code": member_code})

  if "Item" not in response or not response["Item"].get("member_code_valid", None):
    return None
  item = response["Item"]
  if item.get("is_deleted", False):
    return None
  return repo.convert_item_to_object(item)


async def convert_members_list(file: UploadFile) -> list[dict[str, Any]]:
  contents = await file.read()
  decoded = contents.decode("utf-8-sig")  # utf-8-sig strips BOM if present
  reader = csv.DictReader(io.StringIO(decoded))
  return list(reader)


def sync_members_list(new_members_list: list[dict[str, Any]], repo: MemberRepository):
  """
  Sync members while preserving existing member codes and their states.
  - Add new members (put_item with is_deleted=False)
  - Restore previously soft-deleted members that reappear in the CSV
  - Soft-delete members absent from the new list (is_deleted=True)
  - Update fields for existing active members
  """
  table = repo.table
  existing_items = _get_members_from_db(repo)
  new_members_list = _normalize_members(new_members_list)

  # Map all DB records by member_code (including soft-deleted)
  existing_by_code = {item["member_code"]: item for item in existing_items}
  new_codes = {nm["member_code"] for nm in new_members_list}

  # Soft-delete members absent from the uploaded CSV
  for code, item in existing_by_code.items():
    if code not in new_codes and not item.get("is_deleted", False):
      table.update_item(
        Key={"member_code": code},
        UpdateExpression="SET #is_deleted = :val",
        ExpressionAttributeNames={"#is_deleted": "is_deleted"},
        ExpressionAttributeValues={":val": True},
      )

  # Create, restore, or update members from the CSV
  for member in new_members_list:
    code = member["member_code"]
    existing = existing_by_code.get(code)

    if existing is None or existing.get("is_deleted", False):
      # New member or restore previously deleted — put full item
      table.put_item(Item=member)
    else:
      # Update existing active member's fields
      table.put_item(Item={**existing, **member, "is_deleted": False})


def update_member_code(member_code: str, repo: MemberRepository) -> None:
  response = repo.table.get_item(Key={"member_code": member_code})
  member_obj = repo.convert_item_to_object(response["Item"])
  response = repo.table.update_item(
    Key={"member_code": member_obj.member_code},
    UpdateExpression="SET #member_code_valid = :member_code_valid",
    ExpressionAttributeNames={"#member_code_valid": "member_code_valid"},
    ExpressionAttributeValues={":member_code_valid": not member_obj.member_code_valid},
    ReturnValues="ALL_NEW",
  )
  return repo.convert_item_to_object(response["Attributes"])


def is_valid_file_type(file_name: str):
  if not file_name.endswith(".csv"):
    raise InvalidFileTypeError("Invalid members list file type. Allowed type: ['.csv']")


def _normalize_members(new_members_list: list[dict[str, Any]]):
  normalized_members_list = []

  for member in new_members_list:
    raw_phone = member.get("phone") or None
    raw_email = member.get("email") or None

    phone = None
    if raw_phone:
      try:
        phone = validate_phone(raw_phone)
      except ValueError:
        phone = None

    email = None
    if raw_email:
      try:
        email = validate_email(raw_email)
      except ValueError:
        email = None

    normalized_members_list.append(
      {
        "first_name": member["first_name"].capitalize(),
        "middle_name": member.get("middle_name") or None,
        "last_name": member["last_name"].capitalize(),
        "phone": phone,
        "email": email,
        "member_code": member["member_code"],
        "member_code_valid": True,
        "proxy": member["proxy"] in ["1", "yes", "true"],
        "is_deleted": False,
      }
    )
  return normalized_members_list


def get_member_by_code(member_code: str, repo: MemberRepository) -> Member | None:
  """Get a member by member code. Returns None if not found or soft-deleted."""
  response = repo.table.get_item(Key={"member_code": member_code})

  if "Item" not in response:
    return None

  member = repo.convert_item_to_object(response["Item"])
  if member.is_deleted:
    return None
  return member


def update_member(member_code: str, member_data: MemberUpdate, repo: MemberRepository) -> Member:
  """Update member email and phone."""

  existing_member = get_member_by_code(member_code, repo)
  if not existing_member:
    raise MemberNotFoundError(member_code)

  update_expression_parts = []
  expression_attribute_values = {}
  expression_attribute_names = {}

  if member_data.email is not None:
    try:
      validated_email = validate_email(member_data.email)
      update_expression_parts.append("#email = :email")
      expression_attribute_values[":email"] = validated_email
      expression_attribute_names["#email"] = "email"
    except ValueError as e:
      raise ValidationError(f"Invalid email: {e}")

  if member_data.phone is not None:
    try:
      validated_phone = validate_phone(member_data.phone)
      update_expression_parts.append("#phone = :phone")
      expression_attribute_values[":phone"] = validated_phone
      expression_attribute_names["#phone"] = "phone"
    except ValueError as e:
      raise ValidationError(f"Invalid phone: {e}")

  if not update_expression_parts:
    return existing_member

  update_expression = "SET " + ", ".join(update_expression_parts)

  try:
    response = repo.table.update_item(
      Key={"member_code": member_code},
      UpdateExpression=update_expression,
      ExpressionAttributeValues=expression_attribute_values,
      ExpressionAttributeNames=expression_attribute_names,
      ReturnValues="ALL_NEW",
    )
    return repo.convert_item_to_object(response["Attributes"])
  except ClientError as e:
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")


def delete_member(member_code: str, repo: MemberRepository) -> bool:
  """Soft-delete a member by setting is_deleted=True."""

  existing_member = get_member_by_code(member_code, repo)
  if not existing_member:
    raise MemberNotFoundError(member_code)

  try:
    repo.table.update_item(
      Key={"member_code": member_code},
      UpdateExpression="SET #is_deleted = :is_deleted",
      ExpressionAttributeNames={"#is_deleted": "is_deleted"},
      ExpressionAttributeValues={":is_deleted": True},
    )
    return True
  except ClientError as e:
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")


def list_members(repo: MemberRepository, proxy_only: bool = False) -> list[Member]:
  """List all members or filter by proxy status. Excludes soft-deleted members."""
  try:
    members = _get_members_from_db(repo)
    member_objects = [repo.convert_item_to_object(member) for member in members]
    active = sorted(
      (m for m in member_objects if not m.is_deleted),
      key=lambda m: (m.first_name.lower(), m.middle_name.lower() if m.middle_name else "", m.last_name.lower()),
    )

    if proxy_only:
      return [m for m in active if m.proxy]

    return active
  except ClientError as e:
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")


def members_list_to_csv(repo: MemberRepository) -> io.BytesIO:
  """Export all members (including soft-deleted) to a CSV compatible with sync_members."""
  members = sorted(
    _get_members_from_db(repo),
    key=lambda m: (
      (m.get("first_name") or "").lower(),
      (m.get("middle_name") or "").lower(),
      (m.get("last_name") or "").lower(),
    ),
  )
  fieldnames = ["member_code", "first_name", "middle_name", "last_name", "email", "phone", "proxy"]

  buf = io.StringIO()
  writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore", lineterminator="\n")
  writer.writeheader()
  for item in members:
    writer.writerow({
      "member_code": item.get("member_code", ""),
      "first_name": item.get("first_name", ""),
      "middle_name": item.get("middle_name") or "",
      "last_name": item.get("last_name", ""),
      "email": item.get("email") or "",
      "phone": item.get("phone") or "",
      "proxy": "true" if item.get("proxy") else "false",
    })

  # Return as UTF-8 BOM bytes so Excel opens it correctly
  return io.BytesIO(b"\xef\xbb\xbf" + buf.getvalue().encode("utf-8"))


def _get_members_from_db(repo: MemberRepository) -> list[dict[str, Any]]:
  members = []
  scan_kwargs = {}
  table = repo.table

  while True:
    response = table.scan(**scan_kwargs)
    members.extend(response.get("Items", []))

    if "LastEvaluatedKey" not in response:
      break
    scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]

  return members
