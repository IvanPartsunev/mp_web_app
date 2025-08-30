import os
from typing import List
from urllib.request import Request
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile

from database.operations import UploadsRepository
from files.models import FileMetadata
from utils.decorators import retry

BUCKET = os.environ.get("UPLOADS_BUCKET")
UPLOADS_TABLE_NAME = os.environ.get("UPLOADS_TABLE_NAME")


def get_uploads_repository():
  return UploadsRepository(UPLOADS_TABLE_NAME)


@retry()
def upload_to_s3(file_metadata: FileMetadata, file: UploadFile, repo: UploadsRepository):
  try:
    s3 = boto3.client('s3')
    key = f'{file_metadata.file_type.value}/{file_metadata.file_name}.pdf'
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
      detail="An unexpected error occurred while creating the user."
    )

  return repo.convert_item_to_object(file_metadata_item)
