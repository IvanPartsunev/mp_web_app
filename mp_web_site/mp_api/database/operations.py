from typing import List, Optional, Dict, Any
from uuid import uuid4
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

from mp_web_site.mp_api.database.db_config import get_dynamodb_resource
from mp_web_site.mp_api.modules.users.models import User


class UserRepository:
  def __init__(self):
    self.dynamodb = get_dynamodb_resource()
    self.table = self.dynamodb.Table('users')

  def _convert_to_user(self, item: Dict[str, Any]) -> User:
    """Convert a DynamoDB item to a User model."""
    # Convert Decimal to int for phone
    if 'phone' in item and isinstance(item['phone'], Decimal):
      item['phone'] = int(item['phone'])

    return User(**item)

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
            'KeyType': 'HASH'  # Partition key
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
