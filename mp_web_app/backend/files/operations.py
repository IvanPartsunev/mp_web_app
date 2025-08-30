import os
import boto3
from fastapi import HTTPException

from database.operations import UploadsRepository
from utils.decorators import retry

BUCKET = os.environ.get("UPLOADS_BUCKET")
UPLOADS_TABLE_NAME = os.environ.get("UPLOAD_TABLE_NAME")

def get_uploads_repository():
  return UploadsRepository(UPLOADS_TABLE_NAME)

@retry
def upload_to_s3(directory: str, file):
  try:
    s3 = boto3.client('s3')
    key = f'{directory}/{file.file_name}'
    s3.upload_fileobj(file.file, BUCKET, key)
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Error when uploading the file: {e}")

