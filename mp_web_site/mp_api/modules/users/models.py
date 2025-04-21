from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from uuid import uuid4


class UserRole:
    ADMIN = "admin"
    REGULAR_USER = "regular_user"


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
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class User(UserInDB):
    pass
