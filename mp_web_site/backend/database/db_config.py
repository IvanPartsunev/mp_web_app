import boto3

from functools import lru_cache

from mp_web_site.backend.app_config import DynamoDBSettings


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
