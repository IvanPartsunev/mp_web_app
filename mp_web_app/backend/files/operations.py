import os
import re
from datetime import datetime
from functools import lru_cache
from typing import List
from uuid import uuid4

import boto3
from boto3.dynamodb.conditions import Key
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
def upload_file(file_metadata: FileMetadata, file: UploadFile, repo: UploadsRepository):
    s3 = boto3.client('s3')
    file_name = _create_file_name(file_metadata.file_name, file.filename)
    key = f'{file_metadata.file_type.value}/{file_name}'
    try:
        s3.upload_fileobj(file.file, BUCKET, key)
        create_file_metadata(file_metadata, file_name, key, repo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error when uploading the file: {e}")


def create_file_metadata(file_metadata: FileMetadata, new_file_name: str, key: str, repo: UploadsRepository) -> FileMetadata:
  if file_metadata.file_type == 'private' and not file_metadata.allowed_to:
    raise HTTPException(status_code=400, detail='When [private] is selected allowed users must be specified')
  allowed_to = file_metadata.allowed_to if file_metadata.file_type == 'private' else None
  file_metadata_item = {
    "id": str(uuid4()),
    "file_name": new_file_name,
    "file_type": file_metadata.file_type,
    "bucket": BUCKET,
    "key": key,
    "allowed_to": allowed_to,
    "created_at": datetime.now().isoformat()
  }
  try:
    repo.table.put_item(Item=file_metadata_item)
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Failed to create metadata: {e}")
  return repo.convert_item_to_object(file_metadata_item)


def get_files_metadata(prefix: str, repo: UploadsRepository):
  try:
    response = repo.table.query(
      IndexName='file_type_created_at_index',
      KeyConditionExpression=Key('file_type').eq(prefix),
      ScanIndexForward=False
    )
    items = response['Items']

    while 'LastEvaluatedKey' in response:
      response = repo.table.query(
        IndexName='file_type_created_at_index',
        KeyConditionExpression=Key('file_type').eq(prefix),
        ScanIndexForward=False
      )
      items.extend(response['Items'])
    return items
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Failed to fetch files metadata: {e}")


@retry()
def delete_file(file_metadata: List[FileMetadata], repo: UploadsRepository):
    item_ids = [metadata.id for metadata in file_metadata]
    keys = [metadata.key for metadata in file_metadata]
    s3 = boto3.client('s3')
    try:
        if len(file_metadata) == 1:
            s3.delete_object(Bucket=BUCKET, Key=keys[0])
        else:
            objects = [{'Key': key} for key in keys]
            s3.delete_objects(Bucket=BUCKET, Delete={'Objects': objects})
        delete_file_metadata(item_ids=item_ids, repo=repo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error when deleting the file/s: {e}")


def delete_file_metadata(item_ids: List[str], repo: UploadsRepository):
    try:
        if len(item_ids) == 1:
            repo.table.delete_item(Key={"id": item_ids[0]})
        else:
            with repo.table.batch_write() as batch:
                for item_id in item_ids:
                    batch.delete_item(Key={"id": item_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete metadata: {e}")


def _create_file_name(file_name: str, original_name: str):
    now = datetime.now()
    allowed = get_allowed_file_extensions()
    extension = original_name.split('.')[-1]
    if extension not in allowed:
        raise ValueError(f"File extension {extension.upper()} not allowed")
    cleaned_file_name = re.sub(r"[^A-Za-z0-9.\-_\s]", "", file_name).strip()
    file_name_parts = re.split(f"[.\s\-_]", cleaned_file_name)
    date_tag = f"{str(now.year)}_{str(now.month).zfill(2)}_{str(now.day).zfill(2)}"
    file_name = f"{date_tag}_{'_'.join([p.lower() for p in file_name_parts if p != ''])}_{str(uuid4())[:8]}.{extension}"
    return file_name
