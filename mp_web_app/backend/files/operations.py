import os
import re
from datetime import datetime
from functools import lru_cache
from uuid import uuid4

import boto3
from boto3.dynamodb.conditions import Key
from fastapi import UploadFile
from fastapi.responses import StreamingResponse

from app_config import AllowedFileExtensions
from database.repositories import FileMetadataRepository
from files.exceptions import (
  FileAccessDeniedError,
  FileNotFoundError,
  FileUploadError,
  InvalidFileExtensionError,
  InvalidMetadataError,
  MetadataError,
  MissingAllowedUsersError,
)
from files.models import FileMetadata, FileMetadataFull, FileType
from users.models import User
from users.roles import UserRole
from utils.decorators import retry

BUCKET = os.environ.get("UPLOADS_BUCKET")
UPLOADS_TABLE_NAME = os.environ.get("UPLOADS_TABLE_NAME")


@lru_cache
def get_allowed_file_extensions():
  """Get all allowed preset file extensions"""
  return AllowedFileExtensions().allowed_file_extensions


def get_uploads_repository():
  return FileMetadataRepository(UPLOADS_TABLE_NAME)


@retry()
def upload_file(file_metadata: FileMetadata, file: UploadFile, user_id: str, repo: FileMetadataRepository):
  s3 = boto3.client("s3")
  try:
    file_name = _create_file_name(file_metadata.file_name, file.filename)
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
  }
  try:
    repo.table.put_item(Item=file_metadata_item)
  except Exception as e:
    raise MetadataError(f"Failed to create metadata: {e}")
  return repo.convert_item_to_object_full(file_metadata_item)


def get_files_metadata(file_type: str, repo: FileMetadataRepository):
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
      )
      items.extend(response["Items"])

    files_metadata = [repo.convert_item_to_object(item) for item in items]
    return files_metadata

  except Exception as e:
    raise MetadataError(f"Failed to fetch files metadata: {e}")


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


def _create_file_name(file_name: str, original_name: str):
  if not file_name:
    file_name = original_name
  now = datetime.now()
  allowed = get_allowed_file_extensions()
  extension = original_name.split(".")[-1]
  if extension not in allowed:
    raise InvalidFileExtensionError(extension, allowed)
  cleaned_file_name = re.sub(r"[^A-Za-z0-9.\-_\s]", "", file_name).strip()
  file_name_parts = re.split(r"[.\s\-_]", cleaned_file_name)
  date_tag = f"{now.year!s}_{str(now.month).zfill(2)}_{str(now.day).zfill(2)}"
  file_name = f"{date_tag}_{'_'.join([p.lower() for p in file_name_parts if p != ''])}_{str(uuid4())[:8]}.{extension}"
  return file_name


def download_file(file_metadata: FileMetadata | list[FileMetadata], user: User, repo: FileMetadataRepository):
  file_meta_object = get_db_metadata(file_metadata, repo)

  user_id = None
  if user.role != UserRole.REGULAR_USER.value and user.role != UserRole.ACCOUNTANT.value:
    user_id = user.id

  is_allowed = _check_file_allowed_to_user(file_meta_object, user_id)
  if not is_allowed:
    raise FileAccessDeniedError(file_meta_object.file_name)

  s3 = boto3.client("s3")
  try:
    s3_object = s3.get_object(Bucket=file_meta_object.bucket, Key=file_meta_object.key)
    file_stream = s3_object["Body"]
    return StreamingResponse(
      file_stream,
      media_type="application/octet-stream",
      headers={"Content-Disposition": f'attachment; filename="{file_meta_object.key}"'},
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
  fields = file_metadata.model_fields.keys()
  return file_metadata.model_dump() == db_meta_object.model_dump(include=fields)


def _check_file_allowed_to_user(file_metadata: FileMetadata, user_id: str | None = None) -> bool:
  public_allowed_types = [
    FileType.governing_documents.value,
    FileType.forms.value,
  ]

  private_allowed_types = [
    FileType.minutes.value,
    FileType.governing_documents.value,
    FileType.forms.value,
    FileType.transcripts.value,
    FileType.accounting.value,
    FileType.private_documents.value,
    FileType.others.value,
  ]
  
  is_allowed_to_user = True
  if user_id:
    is_allowed_type = file_metadata.file_type.value in private_allowed_types
    if file_metadata.allowed_to:
      is_allowed_to_user = user_id in file_metadata.allowed_to
  else:
    is_allowed_type = file_metadata.file_type.value in public_allowed_types
  return is_allowed_type and is_allowed_to_user
