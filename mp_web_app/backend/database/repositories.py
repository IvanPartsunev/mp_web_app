from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any

from auth.models import TokenPayload
from database.db_config import get_dynamodb_resource
from files.models import FileMetadata, FileMetadataFull
from members.models import Member
from news.models import News
from users.models import User, UserSecret


class BaseRepository(ABC):
  def __init__(self, table_name: str) -> None:
    self.table_name = table_name
    self.dynamodb = get_dynamodb_resource()
    self.table = self.dynamodb.Table(self.table_name)

  @abstractmethod
  def convert_item_to_object(self, item: dict[str, Any]):
    pass

  @property
  def get_table(self):
    return self.table

  @property
  def get_table_name(self):
    return self.table_name


class UserRepository(BaseRepository):
  def convert_item_to_object(self, item: dict[str, Any]) -> User:
    """Convert a DynamoDB item to a User model."""
    # Convert Decimal to int for phone
    if "phone" in item and isinstance(item["phone"], Decimal):
      item["phone"] = str(item["phone"])

    return User(**item)

  def convert_item_to_object_secret(self, item: dict[str, Any]) -> UserSecret:
    """Convert a DynamoDB item to a UserSecret model containing password and salt."""
    return UserSecret(**item)


class AuthRepository(BaseRepository):
  def convert_item_to_object(self, item: dict[str, Any]) -> TokenPayload:
    """Convert a DynamoDB item to a Token model."""
    return TokenPayload(**item)


class MemberRepository(BaseRepository):
  def convert_item_to_object(self, item: dict[str, Any]):
    """Convert a DynamoDB item to a Member model."""
    return Member(**item)


class FileMetadataRepository(BaseRepository):
  """Convert a DynamoDB item to a FileMetadata model."""

  def convert_item_to_object(self, item: dict[str, Any]):
    return FileMetadata(**item)

  def convert_item_to_object_full(self, item: dict[str, Any]):
    return FileMetadataFull(**item)


class NewsRepository(BaseRepository):
  """Convert a DynamoDB item to a News model."""

  def convert_item_to_object(self, item: dict[str, Any]):
    return News(**item)


class GalleryRepository(BaseRepository):
  """Convert a DynamoDB item to a Gallery model."""

  def convert_item_to_object(self, item: dict[str, Any]):
    from gallery.models import GalleryImageMetadata

    return GalleryImageMetadata(**item)
