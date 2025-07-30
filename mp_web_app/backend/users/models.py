from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
  email: EmailStr
  phone: str


class UserCreate(UserBase):
  password: str
  user_code: str


class UserUpdate(BaseModel):
  email: Optional[EmailStr] = None
  phone: Optional[str] = None
  role: Optional[str] = None
  active: Optional[bool] = None
  subscribed: Optional[bool] = None


class UserUpdatePasswordEmail(BaseModel):
  email: EmailStr


class UserUpdatePassword(BaseModel):
  token: str
  password: str


class User(UserBase):
  id: str
  user_code: Optional[str] = None
  role: str
  created_at: datetime
  updated_at: datetime
  subscribed: bool


class UserSecret(BaseModel):
  id: str
  email: EmailStr
  role: str
  salt: str
  password_hash: str


class UserCode(BaseModel):
  user_code: str
  is_used: bool
