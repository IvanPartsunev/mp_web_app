from pydantic import BaseModel


class Token(BaseModel):
  access_token: str
  refresh_token: str
  token_type: str = "bearer"


class TokenPayload(BaseModel):
  sub: str  # user id or email
  exp: int
  type: str