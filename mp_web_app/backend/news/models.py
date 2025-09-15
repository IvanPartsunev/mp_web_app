from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class NewsType(str, Enum):
  private = "private"
  regular = "regular"

class News(BaseModel):
  id: str
  title: str
  content: str
  author_id: str
  news_type: NewsType
  created_at: datetime | None = None
  updated_at: datetime | None = None
