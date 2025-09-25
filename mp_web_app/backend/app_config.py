import json
import os
from typing import List

import boto3
from pydantic_settings import BaseSettings


def get_jwt_secret():
  secret_arn = os.environ['JWT_SECRET_ARN']
  client = boto3.client('secretsmanager')
  response = client.get_secret_value(SecretId=secret_arn)
  secret = response.get('SecretString')
  if secret:
    return json.loads(secret)['JWT_SECRET']
  raise ValueError("JWT_SECRET not found in secret")


REGION = "eu-central-1"
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL')
COOKIE_DOMAIN = os.getenv('COOKIE_DOMAIN')
MAIL_SENDER = os.getenv('MAIL_SENDER')
ALGORITH = os.getenv('JWT_ALGORITHM')
SECRET_KEY = get_jwt_secret()


class DynamoDBSettings(BaseSettings):
  aws_access_key_id: str
  aws_secret_access_key: str
  region_name: str = REGION
  endpoint_url: str | None = None


class JWTSettings(BaseSettings):
  secret_key: str = SECRET_KEY
  algorithm: str = ALGORITH


class SesSettings(BaseSettings):
  sender: str = MAIL_SENDER
  region: str = REGION


class AllowedFileExtensions(BaseSettings):
  allowed_file_extensions: List[str] = [
    # Images
    "jpg", "jpeg", "png", "gif", "bmp", "tiff", "tif", "webp", "heic", "svg",

    # Text & Documents
    "txt", "md", "rtf", "doc", "docx", "odt", "pages",
    "pdf",

    # Spreadsheets & Presentations (often grouped with documents)
    "xls", "xlsx", "csv", "ods",
    "ppt", "pptx", "odp"
  ]