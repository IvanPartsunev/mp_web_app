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
  uploaded_by_name: str | None = None  # User's full name for display
  created_at: str = datetime.now().isoformat()
  updated_at: str | None = None
  updated_by: str | None = None
  updated_by_name: str | None = None
  allowed_to: list[str] | None = None  # Populated for admin list calls


class FileMetadataFull(FileMetadata):
  bucket: str | None = None
  key: str | None = None
  allowed_to: list[str] | None = None


class UpdateFileMetadataRequest(BaseModel):
  file_name: str
  file_type: FileType


class SharedFileAuditEntry(BaseModel):
  file_id: str
  file_name: str | None = None
  file_type: FileType
  uploaded_by_id: str | None = None
  uploaded_by_name: str | None = None
  created_at: str
  shared_with_id: str
  shared_with_name: str | None = None


class ShareFileRequest(BaseModel):
  user_ids: list[str]


class ShareFileResponse(BaseModel):
  allowed_to: list[str]
