import csv
import io
import os
from typing import Any

from botocore.exceptions import ClientError
from starlette.datastructures import UploadFile

from database.repositories import MemberRepository
from members.exceptions import DatabaseError, InvalidFileTypeError, MemberNotFoundError, ValidationError
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
  return repo.convert_item_to_object(response["Item"])


def create_member(member: Member, repo: MemberRepository):
  member_item = {
    "first_name": member.first_name,
    "last_name": member.last_name,
    "email": validate_email(member.email) if member.email else None,
    "phone": validate_phone(member.phone) if member.phone else None,
    "proxy": member.proxy,
    "member_code": member.member_code,
    "member_code_valid": True,
  }
  try:
    repo.table.put_item(Item=member_item)
  except ClientError as e:
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")


async def convert_members_list(file: UploadFile) -> list[dict[str, Any]]:
  contents = await file.read()
  decoded = contents.decode("utf-8")
  reader = csv.DictReader(io.StringIO(decoded))
  return list(reader)


def sync_members_list(new_members_list: list[dict[str, Any]], repo: MemberRepository):
  """
  Sync persons while preserving existing member codes and their states.
  - Add new persons
  - Remove persons not in the new list
  - Keep existing persons with their code states intact
  """
  table = repo.table
  existing_members = _get_members_from_db(repo)
  new_members_list = _normalize_members(new_members_list)

  if not existing_members:
    with table.batch_writer() as batch:
      for member in new_members_list:
        batch.put_item(Item=member)
    return

  current_members_codes = {em["member_code"]: em for em in existing_members}
  new_members_codes = {nm["member_code"] for nm in new_members_list}

  to_remove = set(current_members_codes.keys()) - new_members_codes
  to_add = new_members_codes - set(current_members_codes.keys())

  with table.batch_writer() as batch:
    for member_code in to_remove:
      batch.delete_item(Key={"member_code": member_code})

    for member in new_members_list:
      if member["member_code"] in to_add:
        batch.put_item(Item=member)


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
    try:
      validate_phone(member["phone"])
      validate_email(member["email"])
    except ValueError:
      member["phone"] = None
      member["email"] = None

    normalized_members_list.append(
      {
        "first_name": member["first_name"].capitalize(),
        "last_name": member["last_name"].capitalize(),
        "phone": member["phone"] if member["phone"] else None,
        "email": member["email"] if member["email"] else None,
        "member_code": member["member_code"],
        "member_code_valid": True,
      }
    )
  return normalized_members_list


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
