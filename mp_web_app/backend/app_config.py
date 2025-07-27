from typing import List

from pydantic_settings import BaseSettings

REGION = "eu-central-1"
FRONTEND_BASE_URL = "http://localhost:3000"


class DynamoDBSettings(BaseSettings):
  """DynamoDB configuration settings."""
  aws_access_key_id: str
  aws_secret_access_key: str
  region_name: str = None
  endpoint_url: str = None

  class Config:
    env_prefix = "DYNAMODB_"
    env_file = ".env"
    extra = "ignore"


class JWTSettings(BaseSettings):
  secret_key: str
  algorithm: str

  class Config:
    env_prefix = "JWT_"
    env_file = ".env"
    extra = "ignore"


class SesSettings(BaseSettings):
  sender: str
  region: str = REGION

  class Config:
    env_prefix = "MAIL_"
    env_file = ".env"
    extra = "ignore"
