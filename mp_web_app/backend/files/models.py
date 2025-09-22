from enum import Enum
from typing import List

from pydantic import BaseModel


class FileType(str, Enum):
  governing_documents = "governing_documents"
  forms = "forms"
  minutes = "minutes"
  transcripts = "transcript"
  accounting = "accounting"
  private_documents = "private_documents"
  others = "others"


class FileMetadata(BaseModel):
  id: str | None = None
  file_name: str | None = None
  file_type: FileType
  uploaded_by: str | None = None


class FileMetadataFull(FileMetadata):
  bucket: str | None = None
  key: str | None = None
  allowed_to: List[str] | None = None
