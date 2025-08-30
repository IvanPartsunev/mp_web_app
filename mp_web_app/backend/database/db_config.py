import boto3

from functools import lru_cache

from app_config import DynamoDBSettings


@lru_cache()
def get_dynamodb_settings() -> DynamoDBSettings:
  """Get DynamoDB settings from environment variables."""
  return DynamoDBSettings()


def get_dynamodb_client():
  """Get a DynamoDB client."""
  settings = get_dynamodb_settings()

  client = boto3.client(
    'dynamodb',
    region_name=settings.region_name,
  )

  return client


def get_dynamodb_resource():
  """Get a DynamoDB resource."""
  settings = get_dynamodb_settings()

  resource = boto3.resource(
    'dynamodb',
    region_name=settings.region_name,
  )

  return resource
