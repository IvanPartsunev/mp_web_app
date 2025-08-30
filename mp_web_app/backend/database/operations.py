from abc import ABC, abstractmethod
from typing import Dict, Any
from decimal import Decimal

from auth.models import TokenPayload
from database.db_config import get_dynamodb_resource
from files.models import FileObject
from users.models import User, UserSecret, UserCode


class BaseRepository(ABC):
  def __init__(self, table_name: str) -> None:
    self.table_name = table_name
    self.dynamodb = get_dynamodb_resource()
    self.table = self.dynamodb.Table(self.table_name)

  @abstractmethod
  def convert_item_to_object(self, item: Dict[str, Any]):
    pass


class UserRepository(BaseRepository):

  def convert_item_to_object(self, item: Dict[str, Any]) -> User:
    """Convert a DynamoDB item to a User model."""
    # Convert Decimal to int for phone
    if 'phone' in item and isinstance(item['phone'], Decimal):
      item['phone'] = str(item['phone'])

    return User(**item)

  def convert_item_to_object_secret(self, item: Dict[str, Any]) -> UserSecret:
    """Convert a DynamoDB item to a UserSecret model containing password and salt."""
    return UserSecret(**item)

  @property
  def get_table(self):
    return self.table


class AuthRepository(BaseRepository):

  def convert_item_to_object(self, item: Dict[str, Any]) -> TokenPayload:
    """Convert a DynamoDB item to a Token model."""
    return TokenPayload(**item)

  @property
  def get_table(self):
    return self.table


class UserCodeRepository(BaseRepository):

  def convert_item_to_object(self, item: Dict[str, Any]):
    """Convert a DynamoDB item to a UserCode model."""
    return UserCode(**item)

  @property
  def get_table(self):
    return self.table


class UploadsRepository(BaseRepository):

  def convert_item_to_object(self, item: Dict[str, Any]):
    return FileObject(**item)

  @property
  def get_table(self):
    return self.table
