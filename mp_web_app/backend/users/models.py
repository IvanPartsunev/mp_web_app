from pydantic import BaseModel, EmailStr, Field
from typing import List
from datetime import datetime


class UserBase(BaseModel):
  first_name: str
  last_name: str
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
  role: str
  active: bool
  created_at: datetime
  updated_at: datetime
  subscribed: bool


class UserSecret(BaseModel):
  id: str
  email: EmailStr
  user_code: str
  role: str
  salt: str
  password_hash: str


class UserCode(BaseModel):
  user_code: str
  is_valid: bool


class UserCodes(BaseModel):
  codes: List[str]
