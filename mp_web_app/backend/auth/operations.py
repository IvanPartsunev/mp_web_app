import os
import time
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Optional, List, Literal
from uuid import uuid4

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import EmailStr

from app_config import JWTSettings
from auth.models import TokenPayload
from database.operations import UserRepository, AuthRepository
from users.models import User, UserSecret
from users.operations import get_user_repository, get_user_by_id, get_user_by_email, verify_password
from users.roles import UserRole, ROLE_HIERARCHY

REFRESH_TABLE_NAME = os.environ.get('REFRESH_TABLE_NAME')
ACCESS_TOKEN_EXPIRE_MINUTES = 1
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


@lru_cache()
def get_jwt_settings() -> JWTSettings:
  """Get JWT settings from environment variables."""
  return JWTSettings()


def get_auth_repository():
  """Dependency to get the auth repository."""
  return AuthRepository(REFRESH_TABLE_NAME)


def generate_access_token(data: dict, expires_delta: Optional[timedelta] = None):
  settings = get_jwt_settings()
  to_encode = data.copy()
  expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
  to_encode.update({"exp": expire, "type": "access"})
  encoded_jwt = jwt.encode(to_encode, settings.secret_key, settings.algorithm)
  return encoded_jwt


def generate_refresh_token(data: dict, repo: AuthRepository, expires_delta: Optional[timedelta] = None):
  settings = get_jwt_settings()
  to_encode = data.copy()
  expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
  jti = str(uuid4())
  # TODO: Make TTL for dynamo to automatically delete expired tokens
  expires_at = int(time.time()) + REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

  refresh = {
    "id": jti,
    "user_id": data["sub"],
    "valid": True,
    "expires_at": expires_at,
  }
  repo.table.put_item(Item=refresh)

  to_encode.update({"exp": expire, "type": "refresh", "jti": jti})
  encoded_jwt = jwt.encode(to_encode, settings.secret_key, settings.algorithm)
  return encoded_jwt


def generate_activation_token(user_id: str, email: EmailStr | str) -> str:
  return generate_token(email, user_id, "activation", 1, "h")


def generate_unsubscribe_token(user_id: str, email: str) -> str:
  return generate_token(email, user_id, "unsubscribe", 15, "m")


def generate_reset_token(user_id: str, email: str) -> str:
  return generate_token(email, user_id, "reset", 3, "m")


def decode_token(token: str):
  settings = get_jwt_settings()
  try:
    payload = jwt.decode(token, settings.secret_key, settings.algorithm)
    return payload
  except JWTError:
    return None


def is_token_expired(token: str):
  payload = decode_token(token)
  if not payload:
    return True
  exp = payload.get("exp")
  if not exp:
    return True
  return datetime.now(timezone.utc).timestamp() > exp


def verify_refresh_token(token: str, repo: AuthRepository) -> TokenPayload:
  # Decode and validate payload structure
  payload = decode_token(token)
  if not payload:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid refresh token",
    )

  try:
    token_payload = TokenPayload(**payload)
  except ValidationError:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid refresh token",
    )

  if token_payload.type != "refresh":
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid token type",
    )

  if not token_payload.jti or not token_payload.sub:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid refresh token",
    )

  # Verify token state in the DB by JTI
  db_item = repo.table.get_item(Key={"id": token_payload.jti}).get("Item")
  if not db_item:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refresh token not found")

  if db_item.get("user_id") != token_payload.sub:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This token does not belong to the user")

  if not db_item.get("valid", False):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

  expires_at = db_item.get("expires_at")
  if expires_at and int(time.time()) >= int(expires_at):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

  return token_payload


def invalidate_token(payload: TokenPayload, repo: AuthRepository):
  jti = payload.jti
  user_id = payload.sub

  response = repo.table.get_item(Key={"id": jti})
  item = response.get("Item")

  if not item:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="Refresh token not found"
    )

  if item.get("user_id") != user_id:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="This token does not belong to the user"
    )

  repo.table.update_item(
    Key={"id": jti},
    UpdateExpression="SET valid = :v",
    ExpressionAttributeValues={":v": False}
  )


def get_current_user(token: str = Depends(oauth2_scheme), repo: UserRepository = Depends(get_user_repository)):
  payload = decode_token(token)
  if not payload or payload.get("type") != "access" and payload.get("type") != "refresh":
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
  user_id: str = payload.get("sub")
  user = get_user_by_id(user_id, repo)
  if not user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
  return user


def authenticate_user(email: str, password: str, repo: UserRepository) -> Optional[UserSecret]:
  user = get_user_by_email(email, repo, secret=True)

  if not user:
    return None

  if verify_password(password_hash=user.password_hash, password=password, salt=user.salt):
    return user
  return None


def role_required(required_roles: List[UserRole]):
  def dependency(current_user: User = Depends(get_current_user)):
    user_role = current_user.role
    if not isinstance(user_role, UserRole):
      user_role = UserRole(user_role)

    allowed_roles = ROLE_HIERARCHY.get(user_role, [])

    if not any(role in allowed_roles for role in required_roles):
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this resource",
      )

    return current_user

  return dependency


def generate_token(
  sub: EmailStr | str,
  user_id: str, t_type: Literal["activation", "unsubscribe", "reset"],
  exp: int,
  time_units: Literal["s", "m", "h", "d"]
):
  settings = get_jwt_settings()

  units_map = {
    "s": lambda n: timedelta(seconds=n),
    "m": lambda n: timedelta(minutes=n),
    "h": lambda n: timedelta(hours=n),
    "d": lambda n: timedelta(days=n),
  }

  expire_delta = datetime.now(timezone.utc) + units_map[time_units](exp)

  payload = {
    "sub": sub,
    "user_id": user_id,
    "type": t_type,
    "exp": expire_delta.timestamp(),
  }

  return jwt.encode(payload, settings.secret_key, algorithm="HS256")
