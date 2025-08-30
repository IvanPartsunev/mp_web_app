from enum import Enum
from typing import List

from pydantic import BaseModel


class FileType(str, Enum):
  private = "private"
  accounting = "accounting"
  regular = "regular"


class FileMetadata(BaseModel):
  file_name: str
  bucket: str | None = None
  key: str | None = None
  file_type: FileType
  allowed_to: List[str] | None = None