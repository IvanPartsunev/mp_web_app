import os
import re
from functools import lru_cache
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile

from app_config import AllowedFileExtensions
from database.operations import UploadsRepository
from files.models import FileMetadata
from utils.decorators import retry

BUCKET = os.environ.get("UPLOADS_BUCKET")
UPLOADS_TABLE_NAME = os.environ.get("UPLOADS_TABLE_NAME")


@lru_cache
def get_allowed_file_extensions():
 """ Get all allowed preset file extensions"""
 return AllowedFileExtensions().allowed_file_extensions

def get_uploads_repository():
  return UploadsRepository(UPLOADS_TABLE_NAME)


@retry()
def upload_to_s3(file_metadata: FileMetadata, file: UploadFile, repo: UploadsRepository):
  try:
    s3 = boto3.client('s3')
    file_name = _create_file_name(file_metadata.file_name, file.filename)
    key = f'{file_metadata.file_type.value}/{file_name}'
    s3.upload_fileobj(file.file, BUCKET, key)
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Error when uploading the file: {e}")

  create_file_metadata(file_metadata, key, repo)


def create_file_metadata(file_metadata: FileMetadata, key: str, repo: UploadsRepository) -> FileMetadata:
  """Create a new meta for uploaded file in DynamoDB."""

  file_metadata_item = {
    "id": str(uuid4()),
    "file_name": file_metadata.file_name,
    "file_type": file_metadata.file_type,
    "bucket": BUCKET,
    "key": key,
    "allowed_to": file_metadata.allowed_to,
  }

  try:
    repo.table.put_item(Item=file_metadata_item)
  except ClientError as e:
    raise HTTPException(
      status_code=500,
      detail=f"Database error: {e.response['Error']['Message']}"
    )
  except Exception as e:
    raise HTTPException(
      status_code=500,
      detail="An unexpected error occurred while creating the metadata."
    )

  return repo.convert_item_to_object(file_metadata_item)


def _create_file_name(file_name: str, original_name: str):
  allowed = get_allowed_file_extensions()
  extension = original_name.split('.')[-1]
  if extension not in allowed:
    raise ValueError(f"File extension {extension.upper()} not allowed")
  cleaned_file_name = re.sub(r"[^A-Za-z0-9.\-_\s]", "", file_name).strip()
  file_name_parts = re.split(f"[.\s\-_]", cleaned_file_name)
  file_name = f"{"_".join([p.lower() for p in file_name_parts if p != ""])}.{extension}"

  return file_name