import json
import os
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
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', "http://localhost:3000")
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
