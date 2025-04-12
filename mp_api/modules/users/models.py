from pydantic import BaseModel, EmailStr, Field
from uuid import uuid4

from modules.users.roles import UserRole


class UserBase(BaseModel):
  email: EmailStr
  phone: int
  role: list[UserRole] = [UserRole.REGULAR_USER]  # default role can be a regular user
  active: bool = False


class UserCreate(UserBase):
  password: str
  activation_token: str = Field(default_factory=lambda: str(uuid4()))


class User(UserBase):
  id: str = Field(default_factory=lambda: str(uuid4()))
  hashed_password: str