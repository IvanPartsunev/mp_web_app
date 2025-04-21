import boto3

from functools import lru_cache
from pydantic_settings import BaseSettings


class DynamoDBSettings(BaseSettings):
  """DynamoDB configuration settings."""
  aws_access_key_id: str
  aws_secret_access_key: str
  region_name: str = "eu-central-1"
  endpoint_url: str = None  # For local DynamoDB, use "http://localhost:8000"

  class Config:
    env_prefix = "DYNAMODB_"
    env_file = ".env"


@lru_cache()
def get_dynamodb_settings() -> DynamoDBSettings:
  """Get DynamoDB settings from environment variables."""
  return DynamoDBSettings()


def get_dynamodb_client():
  """Get a DynamoDB client."""
  settings = get_dynamodb_settings()

  client = boto3.client(
    'dynamodb',
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.region_name,
    endpoint_url=settings.endpoint_url
  )

  return client


def get_dynamodb_resource():
  """Get a DynamoDB resource."""
  settings = get_dynamodb_settings()

  resource = boto3.resource(
    'dynamodb',
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.region_name,
    endpoint_url=settings.endpoint_url
  )

  return resource
