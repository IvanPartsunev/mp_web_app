from datetime import datetime
from typing import List

from pydantic import BaseModel, EmailStr, Field

from mp_web_site.backend.users.roles import UserRole


class UserResponse(BaseModel):
  id: str
  email: EmailStr
  role: List[str] = [UserRole.REGULAR_USER]
  active: bool = False
  created_at: datetime = Field(default_factory=datetime.now)