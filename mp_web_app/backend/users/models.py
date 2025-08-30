from pydantic import BaseModel, EmailStr, Field
from typing import List
from datetime import datetime


class UserBase(BaseModel):
  email: EmailStr
  phone: str


class UserCreate(UserBase):
  password: str
  user_code: str


class UserUpdate(BaseModel):
  email: EmailStr | None = None
  phone: str | None = None
  role: str | None = None
  active: bool | None = None
  subscribed: bool | None = None


class UserUpdatePasswordEmail(BaseModel):
  email: EmailStr


class UserUpdatePassword(BaseModel):
  token: str
  password: str


class User(UserBase):
  id: str
  user_code: str
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
  is_valid: bool


class UserCodes(BaseModel):
  codes: List[str]
