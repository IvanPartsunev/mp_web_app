from typing import List

from pydantic import BaseModel


class FileObject(BaseModel):
  name: str
  bucket: str
  key: str
  type: str
  allowed_to: List[str] | None = None