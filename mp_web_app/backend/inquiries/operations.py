import os
from datetime import datetime
from typing import Any
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

from database.repositories import InquiryRepository, UserRepository
from inquiries.exceptions import InquiryAccessDeniedError, InquiryNotFoundError, InquiryStatusError
from inquiries.models import (
  IMMUTABLE_AFTER,
  AssignEntryNumber,
  CloseInquiry,
  ClosingRecord,
  Inquiry,
  InquiryCreate,
  InquiryStatus,
  InquiryUpdate,
)
from users.roles import UserRole

INQUIRIES_TABLE_NAME = os.environ.get("INQUIRIES_TABLE_NAME")
USERS_TABLE_NAME = os.environ.get("USERS_TABLE_NAME")
BUCKET = os.environ.get("UPLOADS_BUCKET")

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def get_inquiry_repository() -> InquiryRepository:
  return InquiryRepository(INQUIRIES_TABLE_NAME)


def get_user_repository() -> UserRepository:
  return UserRepository(USERS_TABLE_NAME)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _resolve_user_name(user_id: str, user_repo: UserRepository) -> str:
  """Return 'First Last' for a user ID, or the raw ID as fallback."""
  try:
    resp = user_repo.table.get_item(Key={"id": user_id})
    if "Item" in resp:
      u = user_repo.convert_item_to_object(resp["Item"])
      return f"{u.first_name} {u.last_name}"
  except Exception:
    pass
  return user_id


def _resolve_names_for_list(user_ids: list[str], user_repo: UserRepository) -> list[str]:
  return [_resolve_user_name(uid, user_repo) for uid in user_ids]


def _get_users_by_role(role: str, user_repo: UserRepository) -> list[Any]:
  """Scan users table and return all users that have the given role."""
  try:
    items: list[dict] = []
    resp = user_repo.table.scan(
      FilterExpression="#r = :r",
      ExpressionAttributeNames={"#r": "role"},
      ExpressionAttributeValues={":r": role},
    )
    items.extend(resp.get("Items", []))
    while "LastEvaluatedKey" in resp:
      resp = user_repo.table.scan(
        FilterExpression="#r = :r",
        ExpressionAttributeNames={"#r": "role"},
        ExpressionAttributeValues={":r": role},
        ExclusiveStartKey=resp["LastEvaluatedKey"],
      )
      items.extend(resp.get("Items", []))
    return [user_repo.convert_item_to_object(item) for item in items]
  except Exception:
    return []


def _check_file_sizes(files: list[UploadFile]) -> None:
  """Raise ValueError if the total size of all files exceeds MAX_FILE_SIZE_BYTES."""
  total = 0
  for f in files:
    f.file.seek(0, 2)
    total += f.file.tell()
    f.file.seek(0)
  if total > MAX_FILE_SIZE_BYTES:
    raise ValueError(f"Total file size exceeds 5 MB limit ({total / 1024 / 1024:.1f} MB uploaded)")


def _upload_inquiry_files(files: list[UploadFile], inquiry_id: str) -> list[str]:
  """Upload files to S3 under inquiries/{inquiry_id}/ and return their keys."""
  if not files:
    return []
  s3 = boto3.client("s3")
  keys: list[str] = []
  for f in files:
    if not f.filename:
      continue
    safe_name = f.filename.replace(" ", "_")
    key = f"inquiries/{inquiry_id}/{uuid4()}_{safe_name}"
    try:
      s3.upload_fileobj(f.file, BUCKET, key)
      keys.append(key)
    except ClientError as e:
      raise RuntimeError(f"Failed to upload file {f.filename}: {e.response['Error']['Message']}")
  return keys


def _delete_inquiry_files(s3_keys: list[str]) -> None:
  """Delete a list of S3 objects. Silently ignores errors."""
  if not s3_keys:
    return
  s3 = boto3.client("s3")
  try:
    s3.delete_objects(
      Bucket=BUCKET,
      Delete={"Objects": [{"Key": k} for k in s3_keys]},
    )
  except ClientError:
    pass


def _delete_inquiry_folder(inquiry_id: str) -> None:
  """Delete all S3 objects under inquiries/{inquiry_id}/."""
  s3 = boto3.client("s3")
  prefix = f"inquiries/{inquiry_id}/"
  try:
    paginator = s3.get_paginator("list_objects_v2")
    keys: list[dict] = []
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
      for obj in page.get("Contents", []):
        keys.append({"Key": obj["Key"]})
    if keys:
      s3.delete_objects(Bucket=BUCKET, Delete={"Objects": keys})
  except ClientError:
    pass


def _sort_inquiries(inquiries: list[Inquiry]) -> list[Inquiry]:
  """Sort inquiries: null entry_number first, then descending numeric entry_number."""

  def sort_key(inq: Inquiry):
    if not inq.entry_number:
      return (0, 0)
    try:
      return (1, -int(inq.entry_number))
    except ValueError:
      return (1, 0)

  return sorted(inquiries, key=sort_key)


def _enrich_inquiry(inquiry: Inquiry, user_repo: UserRepository) -> None:
  """Resolve author and co-author names in place."""
  inquiry.author_name = _resolve_user_name(inquiry.author_id, user_repo)
  if inquiry.co_authors:
    inquiry.co_author_names = _resolve_names_for_list(inquiry.co_authors, user_repo)


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


def get_inquiry(inquiry_id: str, repo: InquiryRepository) -> Inquiry:
  response = repo.table.get_item(Key={"id": inquiry_id})
  if "Item" not in response:
    raise InquiryNotFoundError(inquiry_id)
  return repo.convert_item_to_object(response["Item"])


def create_inquiry(
  data: InquiryCreate,
  files: list[UploadFile],
  author_id: str,
  repo: InquiryRepository,
  user_repo: UserRepository,
) -> Inquiry:
  if data.inquiry_type.strip() == "":
    raise ValueError("Inquiry type cannot be empty")
  if not data.title.strip():
    raise ValueError("Title is required")
  if not data.description.strip():
    raise ValueError("Description is required")

  # Ensure admin is always in scope
  scope = list(set(data.scope) | {"admin"})

  if files:
    _check_file_sizes(files)

  inquiry_id = str(uuid4())
  now = datetime.now().isoformat()
  author_name = _resolve_user_name(author_id, user_repo)
  co_author_names = _resolve_names_for_list(data.co_authors, user_repo) if data.co_authors else []

  s3_keys = _upload_inquiry_files(files, inquiry_id)

  item: dict[str, Any] = {
    "id": inquiry_id,
    "title": data.title.strip(),
    "description": data.description.strip(),
    "inquiry_type": data.inquiry_type.strip(),
    "scope": scope,
    "author_id": author_id,
    "author_name": author_name,
    "co_authors": data.co_authors,
    "co_author_names": co_author_names,
    "status": InquiryStatus.SENT,
    "entry_number": None,
    "file_s3_keys": s3_keys,
    "closing_record": None,
    "created_at": now,
    "updated_at": now,
  }

  try:
    repo.table.put_item(Item=item)
  except ClientError as e:
    _delete_inquiry_files(s3_keys)
    raise RuntimeError(f"Database error: {e.response['Error']['Message']}")

  inquiry = repo.convert_item_to_object(item)
  return inquiry


def update_inquiry(
  inquiry: Inquiry,
  data: InquiryUpdate,
  files: list[UploadFile],
  repo: InquiryRepository,
  user_repo: UserRepository,
) -> Inquiry:
  """Update an inquiry. Title/description/type locked once status != sent."""
  immutable = inquiry.status in IMMUTABLE_AFTER

  if immutable and (data.title is not None or data.description is not None or data.inquiry_type is not None):
    raise InquiryStatusError("Title, description, and type cannot be changed after the inquiry is accepted")

  if files:
    _check_file_sizes(files)
    new_keys = _upload_inquiry_files(files, inquiry.id)
  else:
    new_keys = []

  now = datetime.now().isoformat()
  update_parts: list[str] = ["#updated_at = :updated_at"]
  attr_values: dict[str, Any] = {":updated_at": now}
  attr_names: dict[str, str] = {"#updated_at": "updated_at"}

  if not immutable and data.title is not None:
    update_parts.append("#title = :title")
    attr_values[":title"] = data.title.strip()
    attr_names["#title"] = "title"

  if not immutable and data.description is not None:
    update_parts.append("#description = :description")
    attr_values[":description"] = data.description.strip()
    attr_names["#description"] = "description"

  if not immutable and data.inquiry_type is not None:
    update_parts.append("#inquiry_type = :inquiry_type")
    attr_values[":inquiry_type"] = data.inquiry_type.strip()
    attr_names["#inquiry_type"] = "inquiry_type"

  if data.scope is not None:
    new_scope = list(set(data.scope) | {"admin"})
    update_parts.append("#scope = :scope")
    attr_values[":scope"] = new_scope
    attr_names["#scope"] = "scope"

  if data.co_authors is not None:
    co_author_names = _resolve_names_for_list(data.co_authors, user_repo)
    update_parts.append("#co_authors = :co_authors")
    attr_values[":co_authors"] = data.co_authors
    attr_names["#co_authors"] = "co_authors"
    update_parts.append("#co_author_names = :co_author_names")
    attr_values[":co_author_names"] = co_author_names
    attr_names["#co_author_names"] = "co_author_names"

  if new_keys:
    existing_keys = inquiry.file_s3_keys or []
    merged_keys = existing_keys + new_keys
    update_parts.append("#file_s3_keys = :file_s3_keys")
    attr_values[":file_s3_keys"] = merged_keys
    attr_names["#file_s3_keys"] = "file_s3_keys"

  response = repo.table.update_item(
    Key={"id": inquiry.id},
    UpdateExpression="SET " + ", ".join(update_parts),
    ExpressionAttributeValues=attr_values,
    ExpressionAttributeNames=attr_names,
    ReturnValues="ALL_NEW",
  )
  return repo.convert_item_to_object(response["Attributes"])


def add_inquiry_files(
  inquiry: Inquiry,
  files: list[UploadFile],
  repo: InquiryRepository,
) -> Inquiry:
  """Append additional files to an existing inquiry (author, status=sent guard enforced in router)."""
  if not files:
    return inquiry

  _check_file_sizes(files)
  new_keys = _upload_inquiry_files(files, inquiry.id)
  if not new_keys:
    return inquiry

  merged = (inquiry.file_s3_keys or []) + new_keys
  now = datetime.now().isoformat()

  response = repo.table.update_item(
    Key={"id": inquiry.id},
    UpdateExpression="SET #file_s3_keys = :keys, #updated_at = :ua",
    ExpressionAttributeNames={"#file_s3_keys": "file_s3_keys", "#updated_at": "updated_at"},
    ExpressionAttributeValues={":keys": merged, ":ua": now},
    ReturnValues="ALL_NEW",
  )
  return repo.convert_item_to_object(response["Attributes"])


# ---------------------------------------------------------------------------
# Listing
# ---------------------------------------------------------------------------


def _full_scan(repo: InquiryRepository) -> list[Inquiry]:
  items: list[dict] = []
  resp = repo.table.scan()
  items.extend(resp.get("Items", []))
  while "LastEvaluatedKey" in resp:
    resp = repo.table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
    items.extend(resp.get("Items", []))
  return [repo.convert_item_to_object(item) for item in items]


def list_inquiries_for_user(user_id: str, repo: InquiryRepository, user_repo: UserRepository) -> list[Inquiry]:
  """Return inquiries where user is author or co-author."""
  all_inquiries = _full_scan(repo)
  result = [inq for inq in all_inquiries if inq.author_id == user_id or user_id in (inq.co_authors or [])]
  for inq in result:
    _enrich_inquiry(inq, user_repo)
  return _sort_inquiries(result)


def list_inquiries_for_scope(role: str, repo: InquiryRepository, user_repo: UserRepository) -> list[Inquiry]:
  """Return inquiries that include the given role in their scope."""
  all_inquiries = _full_scan(repo)
  result = [inq for inq in all_inquiries if role in (inq.scope or [])]
  for inq in result:
    _enrich_inquiry(inq, user_repo)
  return _sort_inquiries(result)


def list_all_inquiries(repo: InquiryRepository, user_repo: UserRepository) -> list[Inquiry]:
  """Admin-only: return all inquiries."""
  all_inquiries = _full_scan(repo)
  for inq in all_inquiries:
    _enrich_inquiry(inq, user_repo)
  return _sort_inquiries(all_inquiries)


# ---------------------------------------------------------------------------
# Entry number + status transitions
# ---------------------------------------------------------------------------


def assign_entry_number(
  inquiry: Inquiry,
  data: AssignEntryNumber,
  repo: InquiryRepository,
  user_repo: UserRepository,
) -> Inquiry:
  if inquiry.status != InquiryStatus.SENT:
    raise InquiryStatusError("Entry number can only be assigned to inquiries with status 'sent'")

  now = datetime.now().isoformat()
  # Set entry_number + move directly to in_progress (accepted is a brief intermediate)
  response = repo.table.update_item(
    Key={"id": inquiry.id},
    UpdateExpression="SET #entry_number = :en, #status = :s, #updated_at = :ua",
    ExpressionAttributeNames={
      "#entry_number": "entry_number",
      "#status": "status",
      "#updated_at": "updated_at",
    },
    ExpressionAttributeValues={
      ":en": data.entry_number.strip(),
      ":s": InquiryStatus.IN_PROGRESS,
      ":ua": now,
    },
    ReturnValues="ALL_NEW",
  )
  updated = repo.convert_item_to_object(response["Attributes"])
  _enrich_inquiry(updated, user_repo)

  # Notify author of status change
  try:
    _notify_author_status_change(updated, user_repo)
  except Exception as e:
    print(f"Failed to send status change notification: {e}")

  return updated


# ---------------------------------------------------------------------------
# Closing
# ---------------------------------------------------------------------------


def _can_close(inquiry: Inquiry, user_id: str, user_role: str) -> bool:
  if user_role == UserRole.ADMIN:
    return True
  if inquiry.author_id == user_id:
    return True
  if user_id in (inquiry.co_authors or []):
    return True
  # Scope members: board/control user if their role is in the scope
  return user_role in (inquiry.scope or [])


def close_inquiry(
  inquiry: Inquiry,
  data: CloseInquiry,
  pdf_file: UploadFile | None,
  closing_user_id: str,
  closing_user_role: str,
  repo: InquiryRepository,
  user_repo: UserRepository,
) -> Inquiry:
  if not _can_close(inquiry, closing_user_id, closing_user_role):
    raise InquiryAccessDeniedError()

  valid_final = {InquiryStatus.CLOSED, InquiryStatus.FINISHED, InquiryStatus.FAILED}
  if data.final_status not in valid_final:
    raise InquiryStatusError(f"Invalid final status '{data.final_status}'. Must be one of: closed, finished, failed")

  if not data.reason.strip():
    raise ValueError("A closing reason is required")

  pdf_key: str | None = None
  if pdf_file and pdf_file.filename:
    pdf_file.file.seek(0, 2)
    size = pdf_file.file.tell()
    pdf_file.file.seek(0)
    if size > MAX_FILE_SIZE_BYTES:
      raise ValueError("Closing PDF exceeds the 5 MB limit")
    safe_name = pdf_file.filename.replace(" ", "_")
    pdf_key = f"inquiries/{inquiry.id}/{uuid4()}_closing_{safe_name}"
    s3 = boto3.client("s3")
    try:
      s3.upload_fileobj(pdf_file.file, BUCKET, pdf_key)
    except ClientError as e:
      raise RuntimeError(f"Failed to upload closing PDF: {e.response['Error']['Message']}")

  now = datetime.now().isoformat()
  closing_name = _resolve_user_name(closing_user_id, user_repo)
  closing_record = ClosingRecord(
    closed_by_id=closing_user_id,
    closed_by_name=closing_name,
    final_status=data.final_status,
    reason=data.reason.strip(),
    pdf_s3_key=pdf_key,
    closed_at=now,
  )

  closing_dict = closing_record.model_dump()

  response = repo.table.update_item(
    Key={"id": inquiry.id},
    UpdateExpression="SET #status = :s, #closing_record = :cr, #updated_at = :ua",
    ExpressionAttributeNames={
      "#status": "status",
      "#closing_record": "closing_record",
      "#updated_at": "updated_at",
    },
    ExpressionAttributeValues={
      ":s": data.final_status,
      ":cr": closing_dict,
      ":ua": now,
    },
    ReturnValues="ALL_NEW",
  )
  updated = repo.convert_item_to_object(response["Attributes"])
  _enrich_inquiry(updated, user_repo)

  try:
    _notify_author_status_change(updated, user_repo)
  except Exception as e:
    print(f"Failed to send closure notification: {e}")

  return updated


# ---------------------------------------------------------------------------
# Deletion
# ---------------------------------------------------------------------------


def delete_inquiry(
  inquiry: Inquiry,
  caller_id: str,
  caller_role: str,
  repo: InquiryRepository,
) -> None:
  if caller_role != UserRole.ADMIN and inquiry.author_id != caller_id:
    raise InquiryAccessDeniedError()

  _delete_inquiry_folder(inquiry.id)
  repo.table.delete_item(Key={"id": inquiry.id})


# ---------------------------------------------------------------------------
# PDF export
# ---------------------------------------------------------------------------


def export_pdf(inquiry: Inquiry) -> bytes:
  """Render the inquiry PDF template and return PDF bytes."""
  import base64
  from pathlib import Path

  template_path = Path(__file__).parent / "templates" / "inquiry_pdf.html"
  html_content = template_path.read_text(encoding="utf-8")
  font_dir = Path(__file__).parent / "templates" / "fonts"
  font_regular = (font_dir / "DejaVuSans.ttf").resolve().as_posix()
  font_bold = (font_dir / "DejaVuSans-Bold.ttf").resolve().as_posix()

  # Encode logo as base64 for embedding
  logo_path = Path(__file__).parent / "templates" / "logo.svg"
  logo_b64 = ""
  if logo_path.exists():
    logo_b64 = base64.b64encode(logo_path.read_bytes()).decode("utf-8")

  # Bulgarian labels for status and scope
  status_map = {
    "sent": "Изпратено",
    "accepted": "Прието",
    "in_progress": "В процес",
    "closed": "Затворено",
    "finished": "Приключено",
    "failed": "Неуспешно",
  }
  scope_map = {"admin": "Администрация", "board": "Управителен съвет", "control": "Контролен съвет"}

  scope_bg = ", ".join(scope_map.get(s, s) for s in (inquiry.scope or []))
  status_bg = status_map.get(inquiry.status, inquiry.status)
  co_author_names = ", ".join(inquiry.co_author_names) if inquiry.co_author_names else "—"
  entry_number = inquiry.entry_number or "—"
  created_at = inquiry.created_at[:10] if inquiry.created_at else "—"

  html = html_content.format_map(
    {
      "entry_number": entry_number,
      "title": inquiry.title,
      "inquiry_type": inquiry.inquiry_type.upper(),
      "description": inquiry.description,
      "author_name": inquiry.author_name or inquiry.author_id,
      "co_author_names": co_author_names,
      "scope_bg": scope_bg,
      "created_at": created_at,
      "status_bg": status_bg,
      "logo_b64": logo_b64,
      "font_regular": font_regular,
      "font_bold": font_bold,
    }
  )

  try:
    import io

    from xhtml2pdf import pisa

    buf = io.BytesIO()
    pisa.CreatePDF(html, dest=buf, encoding="utf-8")
    return buf.getvalue()
  except ImportError:
    return html.encode("utf-8")


# ---------------------------------------------------------------------------
# Email notifications
# ---------------------------------------------------------------------------


def _notify_involved(inquiry: Inquiry, user_repo: UserRepository) -> None:
  """Send notification to co-authors and scope-role users when an inquiry is created."""
  from app_config import FRONTEND_BASE_URL
  from mail.operations import send_inquiry_notification

  inquiry_link = f"{FRONTEND_BASE_URL}/inquiries/{inquiry.id}"
  notified: set[str] = set()

  # Co-authors
  for uid in inquiry.co_authors or []:
    if uid in notified:
      continue
    try:
      resp = user_repo.table.get_item(Key={"id": uid})
      if "Item" in resp:
        u = user_repo.convert_item_to_object(resp["Item"])
        if u.email:
          send_inquiry_notification(
            email=u.email,
            recipient_name=f"{u.first_name} {u.last_name}",
            inquiry_title=inquiry.title,
            status_bg="Изпратено",
            inquiry_link=inquiry_link,
          )
          notified.add(uid)
    except Exception as e:
      print(f"Failed to notify co-author {uid}: {e}")

  # Scope roles (board / control) — get all users with those roles
  for scope_role in inquiry.scope or []:
    if scope_role == "admin":
      role_value = UserRole.ADMIN
    elif scope_role == "board":
      role_value = UserRole.BOARD
    elif scope_role == "control":
      role_value = UserRole.CONTROL
    else:
      continue

    for u in _get_users_by_role(role_value, user_repo):
      if u.id in notified:
        continue
      try:
        if u.email:
          send_inquiry_notification(
            email=u.email,
            recipient_name=f"{u.first_name} {u.last_name}",
            inquiry_title=inquiry.title,
            status_bg="Изпратено",
            inquiry_link=inquiry_link,
          )
          notified.add(u.id)
      except Exception as e:
        print(f"Failed to notify scope user {u.id}: {e}")


def _notify_author_status_change(inquiry: Inquiry, user_repo: UserRepository) -> None:
  """Notify the inquiry author of a status change."""
  from app_config import FRONTEND_BASE_URL
  from mail.operations import send_inquiry_notification

  status_map = {
    "sent": "Изпратено",
    "accepted": "Прието",
    "in_progress": "В процес",
    "closed": "Затворено",
    "finished": "Приключено",
    "failed": "Неуспешно",
  }
  try:
    resp = user_repo.table.get_item(Key={"id": inquiry.author_id})
    if "Item" not in resp:
      return
    author = user_repo.convert_item_to_object(resp["Item"])
    if not author.email:
      return
    inquiry_link = f"{FRONTEND_BASE_URL}/inquiries/{inquiry.id}"
    send_inquiry_notification(
      email=author.email,
      recipient_name=f"{author.first_name} {author.last_name}",
      inquiry_title=inquiry.title,
      status_bg=status_map.get(inquiry.status, inquiry.status),
      inquiry_link=inquiry_link,
    )
  except Exception as e:
    print(f"Failed to notify author {inquiry.author_id} of status change: {e}")
