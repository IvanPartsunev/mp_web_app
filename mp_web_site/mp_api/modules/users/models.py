from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from mp_web_site.mp_api.modules.users.roles import UserRole


class UserBase(BaseModel):
    email: EmailStr
    phone: int
    role: List[str] = [UserRole.REGULAR_USER]
    active: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[int] = None
    role: Optional[List[str]] = None
    active: Optional[bool] = None
    password: Optional[str] = None


class UserInDB(UserBase):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_code: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class User(UserInDB):
    pass
