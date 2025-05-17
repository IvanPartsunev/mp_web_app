from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import uuid4

from mp_web_site.backend.users.roles import UserRole


class UserBase(BaseModel):
    email: EmailStr
    phone: int

class UserCreate(UserBase):
    # created_at: datetime = Field(default_factory=datetime.now)
    # updated_at: datetime = Field(default_factory=datetime.now)
    # active: bool
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[int] = None
    role: Optional[str] = None
    active: Optional[bool] = None
    # password: Optional[str] = None


class UserSecret(BaseModel):
    id: str
    email: EmailStr
    role: str
    salt: str
    password_hash: str


class UserInDB(UserBase):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_code: Optional[str] = None
    role: str = UserRole.REGULAR_USER.value
    active: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class User(UserBase):
    id: str
    user_code: Optional[str] = None
    role: str
    created_at: datetime
    updated_at: datetime

