from abc import ABC, abstractmethod
from typing import Dict, Any
from decimal import Decimal

from auth.models import TokenPayload
from database.db_config import get_dynamodb_resource
from users.models import User, UserSecret, UserCode


class BaseRepository(ABC):
  def __init__(self, table_name: str) -> None:
    self.table_name = table_name
    self.dynamodb = get_dynamodb_resource()
    self.table = self.dynamodb.Table(self.table_name)

  @abstractmethod
  def create_table_if_not_exists(self):
    pass


class UserRepository(BaseRepository):

  @staticmethod
  def convert_item_to_user(item: Dict[str, Any]) -> User:
    """Convert a DynamoDB item to a User model."""
    # Convert Decimal to int for phone
    if 'phone' in item and isinstance(item['phone'], Decimal):
      item['phone'] = str(item['phone'])

    return User(**item)

  @staticmethod
  def convert_item_to_user_secret(item: Dict[str, Any]) -> UserSecret:
    """Convert a DynamoDB item to a UserSecret model containing password and salt."""
    return UserSecret(**item)

  def create_table_if_not_exists(self):
    """Create the users table if it doesn't exist."""
    try:
      self.dynamodb.meta.client.describe_table(TableName=self.table_name)

    except self.dynamodb.meta.client.exceptions.ResourceNotFoundException:
      self.table = self.dynamodb.create_table(
        TableName=self.table_name,
        KeySchema=[
          {
            'AttributeName': 'id',
            'KeyType': 'HASH'
          }
        ],
        AttributeDefinitions=[
          {
            'AttributeName': 'id',
            'AttributeType': 'S'
          },
          {
            'AttributeName': 'email',
            'AttributeType': 'S'
          }
        ],
        GlobalSecondaryIndexes=[
          {
            'IndexName': 'email-index',
            'KeySchema': [
              {
                'AttributeName': 'email',
                'KeyType': 'HASH'
              }
            ],
            'Projection': {
              'ProjectionType': 'ALL'
            },
            'ProvisionedThroughput': {
              'ReadCapacityUnits': 1,
              'WriteCapacityUnits': 1
            }
          }
        ],
        ProvisionedThroughput={
          'ReadCapacityUnits': 1,
          'WriteCapacityUnits': 1
        }
      )
      # Wait until the table exists
      self.table.meta.client.get_waiter('table_exists').wait(TableName=self.table_name)

    return self.table


class AuthRepository(BaseRepository):

  @staticmethod
  def convert_item_to_token(item: Dict[str, Any]) -> TokenPayload:
    """Convert a DynamoDB item to a Token model."""
    return TokenPayload(**item)

  def create_table_if_not_exists(self):
    """Create the jwt refresh token table if it doesn't exist."""
    try:
      self.dynamodb.meta.client.describe_table(TableName=self.table_name)

    except self.dynamodb.meta.client.exceptions.ResourceNotFoundException:
      self.table = self.dynamodb.create_table(
        TableName=self.table_name,
        KeySchema=[
          {
            'AttributeName': 'id',
            'KeyType': 'HASH'
          }
        ],
        AttributeDefinitions=[
          {
            'AttributeName': 'id',
            'AttributeType': 'S'
          },
        ],
        ProvisionedThroughput={
          'ReadCapacityUnits': 1,
          'WriteCapacityUnits': 1
        }
      )
      # Wait until the table exists
      self.table.meta.client.get_waiter('table_exists').wait(TableName=self.table_name)

    return self.table


class UserCodeRepository(BaseRepository):

  @staticmethod
  def convert_item_to_code(item: Dict[str, Any]):
    """Convert a DynamoDB item to a UserCode model."""
    return UserCode(**item)

  def create_table_if_not_exists(self):
    """Create the user code table if it doesn't exist."""
    try:
      self.dynamodb.meta.client.describe_table(TableName=self.table_name)

    except self.dynamodb.meta.client.exceptions.ResourceNotFoundException:
      self.table = self.dynamodb.create_table(
        TableName=self.table_name,
        KeySchema=[
          {
            'AttributeName': 'user_code',
            'KeyType': 'HASH'
          },
        ],
        AttributeDefinitions=[
          {
            'AttributeName': 'user_code',
            'AttributeType': 'S'
          }
        ],
        ProvisionedThroughput={
          'ReadCapacityUnits': 1,
          'WriteCapacityUnits': 1
        }
      )
      self.table.meta.client.get_waiter('table_exists').wait(TableName=self.table_name)

    return self.table
