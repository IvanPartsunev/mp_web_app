from pydantic import BaseModel, EmailStr


class Member(BaseModel):
  first_name: str
  last_name: str
  email: EmailStr | None
  phone: str | None
  member_code: str
  member_code_valid: bool = True
  proxy: bool = False
