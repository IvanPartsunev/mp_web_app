import os
import boto3
from fastapi import File, UploadFile, HTTPException

from utils.decorators import retry

BUCKET = os.getenv("UPLOADS_BUCKET", None)

@retry
def upload_to_s3(directory: str, file):
  try:
    s3 = boto3.client('s3')
    key = f'{directory}/{file.file_name}'
    s3.upload_fileobj(file.file, BUCKET, key)
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Error when uploading the file: {e}")

