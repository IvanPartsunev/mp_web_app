from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class InquiryType(StrEnum):
  MOLBA = "молба"
  ZAPITВАНЕ = "запитване"
  SIGNAL = "сигнал"


# All valid inquiry types in one list — update here when new types are needed.
INQUIRY_TYPES: list[str] = [t.value for t in InquiryType]


class InquiryStatus(StrEnum):
  SENT = "sent"
  ACCEPTED = "accepted"
  IN_PROGRESS = "in_progress"
  CLOSED = "closed"
  FINISHED = "finished"
  FAILED = "failed"


# Statuses that represent a terminal / closed state
TERMINAL_STATUSES = {InquiryStatus.CLOSED, InquiryStatus.FINISHED, InquiryStatus.FAILED}

# Statuses that lock the title/description/type from further edits
IMMUTABLE_AFTER = {
  InquiryStatus.ACCEPTED,
  InquiryStatus.IN_PROGRESS,
  InquiryStatus.CLOSED,
  InquiryStatus.FINISHED,
  InquiryStatus.FAILED,
}


class ClosingRecord(BaseModel):
  closed_by_id: str
  closed_by_name: str
  final_status: str  # one of: closed | finished | failed
  reason: str
  pdf_s3_key: str | None = None
  closed_at: str


class Inquiry(BaseModel):
  model_config = ConfigDict(extra="ignore")

  id: str | None = None
  title: str
  description: str
  inquiry_type: str  # kept as str so new types require no model change
  scope: list[str] = []  # always contains "admin"; optionally "board", "control"
  author_id: str
  author_name: str | None = None
  co_authors: list[str] = []  # user IDs
  co_author_names: list[str] = []
  status: str = InquiryStatus.SENT
  entry_number: str | None = None
  file_s3_keys: list[str] = []
  closing_record: ClosingRecord | None = None
  created_at: str = datetime.now().isoformat()
  updated_at: str = datetime.now().isoformat()


class InquiryCreate(BaseModel):
  title: str
  description: str
  inquiry_type: str
  scope: list[str]  # must include "admin"; may include "board", "control"
  co_authors: list[str] = []


class InquiryUpdate(BaseModel):
  description: str | None = None
  co_authors: list[str] | None = None
  scope: list[str] | None = None
  # title and type can only be changed while status == sent
  title: str | None = None
  inquiry_type: str | None = None


class AssignEntryNumber(BaseModel):
  entry_number: str


class CloseInquiry(BaseModel):
  final_status: str  # closed | finished | failed
  reason: str
