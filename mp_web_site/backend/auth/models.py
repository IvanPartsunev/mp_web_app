from pydantic import BaseModel


class Token(BaseModel):
  access_token: str
  refresh_token: str
  token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
  refresh_token: str


class TokenPayload(BaseModel):
  sub: str # user id or email
  role: str
  exp: int
  type: str