from typing import Dict, Any
from decimal import Decimal

from backend.auth.models import TokenPayload
from backend.database.db_config import get_dynamodb_resource
from backend.users.models import User, UserSecret


class UserRepository:
  def __init__(self):
    self.dynamodb = get_dynamodb_resource()
    self.table = self.dynamodb.Table('users')

  @staticmethod
  def convert_item_to_user(item: Dict[str, Any]) -> User:
    """Convert a DynamoDB item to a User model."""
    # Convert Decimal to int for phone
    if 'phone' in item and isinstance(item['phone'], Decimal):
      item['phone'] = int(item['phone'])

    return User(**item)

  @staticmethod
  def convert_item_to_user_secret(item: Dict[str, Any]) -> UserSecret:
    """Convert a DynamoDB item to a UserSecret model containing password and salt."""
    return UserSecret(**item)

  def create_table_if_not_exists(self):
    """Create the users table if it doesn't exist."""
    try:
      # Check if table exists
      self.dynamodb.meta.client.describe_table(TableName='users')
    except self.dynamodb.meta.client.exceptions.ResourceNotFoundException:
      # Create table
      self.table = self.dynamodb.create_table(
        TableName='users',
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
              'ReadCapacityUnits': 5,
              'WriteCapacityUnits': 5
            }
          }
        ],
        ProvisionedThroughput={
          'ReadCapacityUnits': 5,
          'WriteCapacityUnits': 5
        }
      )
      # Wait until the table exists
      self.table.meta.client.get_waiter('table_exists').wait(TableName='users')

    return self.table


class AuthRepository:
  def __init__(self):
    self.dynamodb = get_dynamodb_resource()
    self.table = self.dynamodb.Table('refresh')

  @staticmethod
  def convert_item_to_token(item: Dict[str, Any]) -> TokenPayload:
    """Convert a DynamoDB item to a Token model."""
    return TokenPayload(**item)

  def create_table_if_not_exists(self):
    """Create the jwt refresh token table if it doesn't exist."""
    try:
      # Check if table exists
      self.dynamodb.meta.client.describe_table(TableName='refresh')
    except self.dynamodb.meta.client.exceptions.ResourceNotFoundException:
      # Create table
      self.table = self.dynamodb.create_table(
        TableName='refresh',
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
          'ReadCapacityUnits': 5,
          'WriteCapacityUnits': 5
        }
      )
      # Wait until the table exists
      self.table.meta.client.get_waiter('table_exists').wait(TableName='refresh')
