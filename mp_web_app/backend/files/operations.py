import os
from datetime import datetime
from functools import lru_cache
from uuid import uuid4

import boto3
from boto3.dynamodb.conditions import Key
from fastapi import UploadFile
from fastapi.responses import StreamingResponse

from app_config import FRONTEND_BASE_URL, AllowedFileExtensions
from database.repositories import FileMetadataRepository, UserRepository
from files.exceptions import (
  FileAccessDeniedError,
  FileNotFoundError,
  FileUploadError,
  InvalidFileExtensionError,
  InvalidMetadataError,
  MetadataError,
  MissingAllowedUsersError,
)
from files.models import FileMetadata, FileMetadataFull, FileType, SharedFileAuditEntry, UpdateFileMetadataRequest
from users.models import User
from users.roles import UserRole
from utils.decorators import retry

BUCKET = os.environ.get("UPLOADS_BUCKET")
UPLOADS_TABLE_NAME = os.environ.get("UPLOADS_TABLE_NAME")
USERS_TABLE_NAME = os.environ.get("USERS_TABLE_NAME")

# Maps each FileType value to its Bulgarian display name and frontend route path
FILE_TYPE_DISPLAY: dict[str, dict] = {
  "governing_documents": {"bg": "Нормативни документи", "route": "governing-documents"},
  "forms":               {"bg": "Бланки",               "route": "forms"},
  "minutes":             {"bg": "Протоколи",             "route": "minutes"},
  "transcripts":         {"bg": "Стенограми",            "route": "transcripts"},
  "accounting":          {"bg": "Счетоводни документи",  "route": "accounting-documents"},
  "others":              {"bg": "Други документи",       "route": "others"},
  "private_documents":   {"bg": "Лични документи",       "route": "mydocuments"},
}


@lru_cache
def get_allowed_file_extensions():
  """Get all allowed preset file extensions"""
  return AllowedFileExtensions().allowed_file_extensions


def _enrich_with_user_names(files_metadata: list[FileMetadata]):
  """Enrich file metadata with uploader names."""
  if not files_metadata:
    return

  # Collect unique user IDs
  user_ids = {fm.uploaded_by for fm in files_metadata if fm.uploaded_by}
  if not user_ids:
    return

  # Fetch users and create a map
  user_repo = UserRepository(USERS_TABLE_NAME)
  users_map = {}

  for user_id in user_ids:
    try:
      response = user_repo.table.get_item(Key={"id": user_id})
      if "Item" in response:
        user = user_repo.convert_item_to_object(response["Item"])
        users_map[user.id] = f"{user.first_name} {user.last_name}"
    except Exception:
      # If fetch fails, continue without this user's name
      continue

  # Enrich file metadata with user names
  for fm in files_metadata:
    if fm.uploaded_by:
      fm.uploaded_by_name = users_map.get(fm.uploaded_by, fm.uploaded_by)


def get_existing_labels(repo: FileMetadataRepository) -> list[str]:
  """Scan uploads table and return a sorted deduplicated list of all label strings."""
  try:
    items: list[dict] = []
    response = repo.table.scan(ProjectionExpression="labels")
    items.extend(response.get("Items", []))
    while "LastEvaluatedKey" in response:
      response = repo.table.scan(
        ProjectionExpression="labels",
        ExclusiveStartKey=response["LastEvaluatedKey"],
      )
      items.extend(response.get("Items", []))
  except Exception as e:
    raise MetadataError(f"Failed to scan labels: {e}")

  label_set: set[str] = set()
  for item in items:
    for lbl in item.get("labels") or []:
      if lbl and lbl.strip():
        label_set.add(lbl.strip())

  return sorted(label_set)


def get_uploads_repository():
  return FileMetadataRepository(UPLOADS_TABLE_NAME)


@retry()
def upload_file(file_metadata: FileMetadata, file: UploadFile, user_id: str, repo: FileMetadataRepository):
  s3 = boto3.client("s3")
  try:
    file_name = _create_file_name(file.filename)
    key = f"{file_metadata.file_type.value}/{file_name}"
    s3.upload_fileobj(file.file, BUCKET, key)
    return create_file_metadata(file_metadata, file_name, key, user_id, repo)
  except Exception as e:
    raise FileUploadError(f"Error when uploading the file: {e}")


def create_file_metadata(
  file_metadata: FileMetadata, new_file_name: str, key: str, user_id: str, repo: FileMetadataRepository
) -> FileMetadata:
  if file_metadata.file_type == "private" and not file_metadata.allowed_to:
    raise MissingAllowedUsersError()
  allowed_to = file_metadata.allowed_to if file_metadata.allowed_to else None
  file_metadata_item = {
    "id": str(uuid4()),
    "file_name": new_file_name,
    "file_type": file_metadata.file_type,
    "bucket": BUCKET,
    "key": key,
    "uploaded_by": user_id,
    "allowed_to": allowed_to,
    "created_at": file_metadata.created_at,
    "updated_at": file_metadata.created_at,
    "updated_by": user_id,
    "labels": file_metadata.labels if file_metadata.labels else None
  }
  try:
    repo.table.put_item(Item=file_metadata_item)
  except Exception as e:
    raise MetadataError(f"Failed to create metadata: {e}")
  return repo.convert_item_to_object_full(file_metadata_item)


def get_files_metadata(
  file_type: str, repo: FileMetadataRepository, user_id: str | None = None, include_allowed_to: bool = False
):
  try:
    response = repo.table.query(
      IndexName="file_type_created_at_index",
      KeyConditionExpression=Key("file_type").eq(file_type),
      ScanIndexForward=False,
    )
    items = response["Items"]

    while "LastEvaluatedKey" in response:
      response = repo.table.query(
        IndexName="file_type_created_at_index",
        KeyConditionExpression=Key("file_type").eq(file_type),
        ScanIndexForward=False,
        ExclusiveStartKey=response["LastEvaluatedKey"],
      )
      items.extend(response["Items"])

    # Private documents are only visible to users explicitly listed in allowed_to
    # Admins (include_allowed_to=True) bypass this filter and see all private documents
    if file_type == FileType.private_documents.value and user_id and not include_allowed_to:
      items = [item for item in items if user_id in (item.get("allowed_to") or [])]

    if include_allowed_to:
      files_metadata = [repo.convert_item_to_object_full(item) for item in items]
    else:
      files_metadata = [repo.convert_item_to_object(item) for item in items]

    # Enrich with user names
    _enrich_with_user_names(files_metadata)

    return files_metadata

  except Exception as e:
    raise MetadataError(f"Failed to fetch files metadata: {e}")


def update_file_metadata(
  file_id: str, request: UpdateFileMetadataRequest, user_id: str, repo: FileMetadataRepository
) -> FileMetadata:
  """Update file_name and file_type of an existing file record."""
  try:
    response = repo.table.get_item(Key={"id": file_id})
  except Exception as e:
    raise MetadataError(f"Failed to fetch file: {e}")

  if "Item" not in response:
    raise FileNotFoundError(f"File with id {file_id} not found")

  now = datetime.now().isoformat()
  # If file_type changes we must also update the S3 key prefix
  item = response["Item"]
  old_file_type = item.get("file_type")
  old_key: str = item.get("key", "")
  new_file_type = request.file_type.value

  # Build label SET/REMOVE expression fragment
  has_labels = bool(request.labels)

  if old_file_type != new_file_type and old_key:
    s3 = boto3.client("s3")
    # Build new key: replace first path segment with new file_type
    key_parts = old_key.split("/", 1)
    new_key = f"{new_file_type}/{key_parts[1]}" if len(key_parts) == 2 else f"{new_file_type}/{old_key}"
    try:
      s3.copy_object(Bucket=BUCKET, CopySource={"Bucket": BUCKET, "Key": old_key}, Key=new_key)
      s3.delete_object(Bucket=BUCKET, Key=old_key)
    except Exception as e:
      raise MetadataError(f"Failed to move S3 object: {e}")

    expr_values: dict = {
      ":fn": request.file_name,
      ":ft": new_file_type,
      ":key": new_key,
      ":ua": now,
      ":ub": user_id,
    }
    update_expr = "SET file_name = :fn, file_type = :ft, #k = :key, updated_at = :ua, updated_by = :ub"
    if has_labels:
      update_expr += ", labels = :lbl"
      expr_values[":lbl"] = request.labels
    else:
      update_expr += " REMOVE labels"

    repo.table.update_item(
      Key={"id": file_id},
      UpdateExpression=update_expr,
      ExpressionAttributeNames={"#k": "key"},
      ExpressionAttributeValues=expr_values,
    )
  else:
    expr_values = {
      ":fn": request.file_name,
      ":ft": new_file_type,
      ":ua": now,
      ":ub": user_id,
    }
    update_expr = "SET file_name = :fn, file_type = :ft, updated_at = :ua, updated_by = :ub"
    if has_labels:
      update_expr += ", labels = :lbl"
      expr_values[":lbl"] = request.labels
    else:
      update_expr += " REMOVE labels"

    repo.table.update_item(
      Key={"id": file_id},
      UpdateExpression=update_expr,
      ExpressionAttributeValues=expr_values,
    )

  updated = repo.table.get_item(Key={"id": file_id})["Item"]
  result = repo.convert_item_to_object(updated)
  _enrich_with_user_names([result])
  _enrich_updated_by_names([result])
  return result


def _enrich_updated_by_names(files_metadata: list[FileMetadata]):
  """Enrich file metadata with updater names."""
  if not files_metadata:
    return
  user_ids = {fm.updated_by for fm in files_metadata if fm.updated_by}
  if not user_ids:
    return
  user_repo = UserRepository(USERS_TABLE_NAME)
  users_map = {}
  for user_id in user_ids:
    try:
      response = user_repo.table.get_item(Key={"id": user_id})
      if "Item" in response:
        user = user_repo.convert_item_to_object(response["Item"])
        users_map[user.id] = f"{user.first_name} {user.last_name}"
    except Exception:
      continue
  for fm in files_metadata:
    if fm.updated_by:
      fm.updated_by_name = users_map.get(fm.updated_by, fm.updated_by)


def delete_file(file_id: str, repo: FileMetadataRepository) -> bool:
  """Delete a single file by ID."""
  s3 = boto3.client("s3")

  try:
    response = repo.table.get_item(Key={"id": file_id})
    if "Item" not in response:
      raise FileNotFoundError(f"File with id {file_id} not found")

    db_metadata = repo.convert_item_to_object_full(response["Item"])
    s3.delete_object(Bucket=db_metadata.bucket, Key=db_metadata.key)
    repo.table.delete_item(Key={"id": file_id})

    return True
  except FileNotFoundError:
    raise
  except Exception as e:
    raise FileUploadError(f"Error when deleting the file: {e}")


def _create_file_name(original_name: str) -> str:
  allowed = get_allowed_file_extensions()
  extension = original_name.split(".")[-1]
  if extension not in allowed:
    raise InvalidFileExtensionError(extension, allowed)
  # Replace spaces with underscores, keep everything else as-is
  file_name = original_name.replace(" ", "_")
  return file_name


def download_file(file_metadata: FileMetadata | list[FileMetadata], user: User, repo: FileMetadataRepository):
  file_meta_object = get_db_metadata(file_metadata, repo)

  # All logged-in users should have access to their allowed files
  user_id = user.id
  user_role = user.role

  is_allowed = _check_file_allowed_to_user(file_meta_object, user_id, user_role)
  if not is_allowed:
    raise FileAccessDeniedError(file_meta_object.file_name)

  s3 = boto3.client("s3")
  try:
    s3_object = s3.get_object(Bucket=file_meta_object.bucket, Key=file_meta_object.key)
    file_stream = s3_object["Body"]

    # Properly encode filename for Cyrillic and other Unicode characters
    from urllib.parse import quote

    encoded_filename = quote(file_meta_object.file_name)

    return StreamingResponse(
      file_stream,
      media_type="application/octet-stream",
      headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"},
    )
  except s3.exceptions.NoSuchKey:
    raise FileNotFoundError("File not found")


@retry()
def get_db_metadata(file_metadata: FileMetadata, repo: FileMetadataRepository) -> FileMetadataFull:
  response = repo.table.get_item(Key={"id": file_metadata.id})
  if "Item" not in response:
    raise MetadataError(f"Metadata not found for file: {file_metadata.file_name}")

  db_metadata_object = repo.convert_item_to_object_full(response["Item"])
  is_metadata_valid = _validate_metadata(file_metadata, db_metadata_object)
  if not is_metadata_valid:
    raise InvalidMetadataError(file_metadata.file_name)
  return db_metadata_object


def _validate_metadata(file_metadata: FileMetadata, db_meta_object: FileMetadataFull):
  # Only validate the core identity fields sent by the frontend
  identity_fields = {"id", "file_name", "file_type"}
  return file_metadata.model_dump(include=identity_fields) == db_meta_object.model_dump(include=identity_fields)


def _check_file_allowed_to_user(file_metadata: FileMetadata, user_id: str, user_role: str) -> bool:
  # Public documents - accessible to everyone (logged in or not)
  public_types = [
    FileType.governing_documents.value,
    FileType.forms.value,
  ]

  # Documents accessible to all logged-in users
  logged_in_types = [
    FileType.minutes.value,
    FileType.transcripts.value,
    FileType.others.value,
  ]

  # Accounting documents - only for admin, board, control, accountant
  accounting_allowed_roles = [
    UserRole.ADMIN.value,
    UserRole.BOARD.value,
    UserRole.CONTROL.value,
    UserRole.ACCOUNTANT.value,
  ]

  file_type = file_metadata.file_type.value

  # Public documents - always allowed
  if file_type in public_types:
    return True

  # Documents for all logged-in users
  if file_type in logged_in_types:
    return True

  # Accounting documents - role-based access
  if file_type == FileType.accounting.value:
    return user_role in accounting_allowed_roles

  # Private documents - only for specified users
  if file_type == FileType.private_documents.value:
    if file_metadata.allowed_to:
      return user_id in file_metadata.allowed_to
    return False

  # Default deny
  return False


def get_shared_files_audit(repo: FileMetadataRepository, user_repo: UserRepository) -> list[SharedFileAuditEntry]:
  """Scan uploads table and return one entry per (file, recipient) pair where allowed_to is non-empty."""
  try:
    items = []
    response = repo.table.scan()
    items.extend(response.get("Items", []))
    while "LastEvaluatedKey" in response:
      response = repo.table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
      items.extend(response.get("Items", []))
  except Exception as e:
    raise MetadataError(f"Failed to scan uploads table: {e}")

  # Filter to records with a non-empty allowed_to list
  shared_items = [item for item in items if item.get("allowed_to")]

  if not shared_items:
    return []

  # Collect all user IDs that need resolving (uploaders + all recipients)
  user_ids: set[str] = set()
  for item in shared_items:
    if item.get("uploaded_by"):
      user_ids.add(item["uploaded_by"])
    for uid in item.get("allowed_to", []):
      user_ids.add(uid)

  # Batch-resolve names
  users_map: dict[str, str] = {}
  for uid in user_ids:
    try:
      resp = user_repo.table.get_item(Key={"id": uid})
      if "Item" in resp:
        user = user_repo.convert_item_to_object(resp["Item"])
        users_map[uid] = f"{user.first_name} {user.last_name}"
    except Exception:
      continue

  # Expand each file into one entry per recipient
  entries: list[SharedFileAuditEntry] = []
  for item in shared_items:
    file_id = item.get("id", "")
    file_name = item.get("file_name")
    file_type = item.get("file_type")
    uploaded_by_id = item.get("uploaded_by")
    created_at = item.get("created_at", "")

    for recipient_id in item.get("allowed_to", []):
      entries.append(
        SharedFileAuditEntry(
          file_id=file_id,
          file_name=file_name,
          file_type=file_type,
          uploaded_by_id=uploaded_by_id,
          uploaded_by_name=users_map.get(uploaded_by_id, uploaded_by_id) if uploaded_by_id else None,
          created_at=created_at,
          shared_with_id=recipient_id,
          shared_with_name=users_map.get(recipient_id, recipient_id),
          labels=item.get("labels") or None,
        )
      )

  return entries


def revoke_share(file_id: str, user_id: str, repo: FileMetadataRepository, actor_id: str | None = None) -> list[str]:
  """Remove a specific user from a file's allowed_to list. Returns the remaining allowed_to list."""
  try:
    response = repo.table.get_item(Key={"id": file_id})
  except Exception as e:
    raise MetadataError(f"Failed to fetch file: {e}")

  if "Item" not in response:
    raise FileNotFoundError(f"File with id {file_id} not found")

  allowed_to: list[str] = response["Item"].get("allowed_to") or []

  if user_id not in allowed_to:
    raise FileNotFoundError(f"User {user_id} is not in the allowed_to list for file {file_id}")

  index = allowed_to.index(user_id)
  now = datetime.now().isoformat()

  try:
    update_expr = f"REMOVE allowed_to[{index}]"
    expr_values = {}
    if actor_id:
      update_expr += " SET updated_at = :ua, updated_by = :ub"
      expr_values = {":ua": now, ":ub": actor_id}

    kwargs: dict = {
      "Key": {"id": file_id},
      "UpdateExpression": update_expr,
      "ConditionExpression": "attribute_exists(id)",
    }
    if expr_values:
      kwargs["ExpressionAttributeValues"] = expr_values

    repo.table.update_item(**kwargs)
  except Exception as e:
    raise MetadataError(f"Failed to revoke share: {e}")

  remaining = [u for u in allowed_to if u != user_id]
  return remaining


def notify_shared_users(file_metadata: FileMetadataFull, user_repo: UserRepository) -> None:
  """Send a personal share notification email to each user in file_metadata.allowed_to."""
  from mail.operations import send_file_share_notification
  from users.operations import get_user_by_id

  if not file_metadata.allowed_to:
    return

  download_link = f"{FRONTEND_BASE_URL}/mydocuments"

  for user_id in file_metadata.allowed_to:
    try:
      user = get_user_by_id(user_id, user_repo)
      send_file_share_notification(
        email=user.email,
        file_name=file_metadata.file_name,
        download_link=download_link,
      )
    except Exception as e:
      print(f"Failed to send file share notification to user {user_id}: {e}")
      continue


def notify_upload(file_metadata: FileMetadataFull, user_repo: UserRepository) -> None:
  """Broadcast an upload notification to eligible subscribed users, then send personal share emails if needed.

  Routing rules:
  - private_documents: no broadcast; personal share only (handled by allowed_to list)
  - accounting: broadcast to governance roles (board, control, accountant, admin) only
  - all other types: broadcast to all subscribed users

  After broadcasting, if allowed_to is non-empty, also sends personal share emails.
  """
  from mail.operations import send_upload_notification
  from users.operations import get_subscribed_users

  file_type = file_metadata.file_type.value
  file_info = FILE_TYPE_DISPLAY.get(file_type, {"bg": file_type, "route": "home"})
  category_bg = file_info["bg"]
  documents_link = f"{FRONTEND_BASE_URL}/{file_info['route']}"

  governance_roles = {
    UserRole.BOARD.value,
    UserRole.CONTROL.value,
    UserRole.ACCOUNTANT.value,
    UserRole.ADMIN.value,
  }

  # private_documents: skip broadcast entirely — only personal share emails apply
  if file_type != FileType.private_documents.value:
    try:
      subscribed_users = get_subscribed_users(user_repo)
    except Exception as e:
      print(f"Failed to fetch subscribed users for upload notification: {e}")
      subscribed_users = []

    for user in subscribed_users:
      # Accounting files: governance roles only
      if file_type == FileType.accounting.value and user.role not in governance_roles:
        continue
      try:
        send_upload_notification(
          email=user.email,
          file_name=file_metadata.file_name,
          category_bg=category_bg,
          documents_link=documents_link,
        )
      except Exception as e:
        print(f"Failed to send upload notification to {user.email}: {e}")
        continue

  # Always send personal share emails to users explicitly listed in allowed_to
  if file_metadata.allowed_to:
    notify_shared_users(file_metadata, user_repo)


def get_files_shared_with_user(user_id: str, repo: FileMetadataRepository) -> list[FileMetadata]:
  """Return all files where the given user_id appears in allowed_to, regardless of file_type."""
  try:
    items = []
    response = repo.table.scan(
      FilterExpression="contains(allowed_to, :uid)",
      ExpressionAttributeValues={":uid": user_id},
    )
    items.extend(response.get("Items", []))
    while "LastEvaluatedKey" in response:
      response = repo.table.scan(
        FilterExpression="contains(allowed_to, :uid)",
        ExpressionAttributeValues={":uid": user_id},
        ExclusiveStartKey=response["LastEvaluatedKey"],
      )
      items.extend(response.get("Items", []))

    files_metadata = [repo.convert_item_to_object(item) for item in items]
    _enrich_with_user_names(files_metadata)
    return files_metadata
  except Exception as e:
    raise MetadataError(f"Failed to fetch shared files: {e}")


def add_share(
  file_id: str, user_ids: list[str], repo: FileMetadataRepository, actor_id: str | None = None
) -> list[str]:
  """Append new user IDs to a file's allowed_to list. Returns the updated allowed_to list."""
  try:
    response = repo.table.get_item(Key={"id": file_id})
  except Exception as e:
    raise MetadataError(f"Failed to fetch file: {e}")

  if "Item" not in response:
    raise FileNotFoundError(f"File with id {file_id} not found")

  existing: list[str] = response["Item"].get("allowed_to") or []
  new_ids = [uid for uid in user_ids if uid not in existing]

  if not new_ids:
    return existing

  now = datetime.now().isoformat()

  try:
    expr_values: dict = {":new_ids": new_ids, ":empty": []}
    update_expr = "SET allowed_to = list_append(if_not_exists(allowed_to, :empty), :new_ids)"
    if actor_id:
      update_expr += ", updated_at = :ua, updated_by = :ub"
      expr_values[":ua"] = now
      expr_values[":ub"] = actor_id

    repo.table.update_item(
      Key={"id": file_id},
      UpdateExpression=update_expr,
      ExpressionAttributeValues=expr_values,
      ConditionExpression="attribute_exists(id)",
    )
  except Exception as e:
    raise MetadataError(f"Failed to update allowed_to: {e}")

  return existing + new_ids
