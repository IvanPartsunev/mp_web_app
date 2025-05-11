from pydantic_settings import BaseSettings


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