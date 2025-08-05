import os
from abc import ABC
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

  @property
  def get_table(self):
    return self.table


class AuthRepository(BaseRepository):

  @staticmethod
  def convert_item_to_token(item: Dict[str, Any]) -> TokenPayload:
    """Convert a DynamoDB item to a Token model."""
    return TokenPayload(**item)

  @property
  def get_table(self):
    return self.table


class UserCodeRepository(BaseRepository):

  @staticmethod
  def convert_item_to_code(item: Dict[str, Any]):
    """Convert a DynamoDB item to a UserCode model."""
    return UserCode(**item)

  @property
  def get_table(self):
    return self.table
