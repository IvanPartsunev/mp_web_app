from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class FileType(str, Enum):
  governing_documents = "governing_documents"
  forms = "forms"
  minutes = "minutes"
  transcripts = "transcripts"
  accounting = "accounting"
  private_documents = "private_documents"
  others = "others"


class FileMetadata(BaseModel):
  id: str | None = None
  file_name: str | None = None
  file_type: FileType
  uploaded_by: str | None = None
  created_at: str = datetime.now().isoformat()


class FileMetadataFull(FileMetadata):
  bucket: str | None = None
  key: str | None = None
  allowed_to: list[str] | None = None
