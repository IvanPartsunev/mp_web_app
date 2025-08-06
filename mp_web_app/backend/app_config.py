import os
from typing import List

from pydantic_settings import BaseSettings

REGION = "eu-central-1"
FRONTEND_BASE_URL = "http://localhost:3000"
# FRONTEND_BASE_URL = "https://d3u6t9h0xyyd0j.cloudfront.net/"
SECRET_KEY = os.getenv('JWT_SECRET_KEY')
ALGORITH = os.getenv('JWT_ALGORITHM')
MAIL_SENDER = os.getenv('MAIL_SENDER')


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
