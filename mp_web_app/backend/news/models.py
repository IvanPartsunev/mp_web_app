from enum import Enum

from pydantic import BaseModel


class NewsType(str, Enum):
  private = "private"
  regular = "regular"

class News(BaseModel):
  title: str
  content: str
  news_type: NewsType


class NewsUpdate(BaseModel):
  title: str
  content: str
  news_type: NewsType