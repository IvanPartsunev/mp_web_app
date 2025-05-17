import os
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Optional, List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from mp_web_site.app_config import JWTSettings
from mp_web_site.backend.database.operations import UserRepository
from mp_web_site.backend.users.models import User
from mp_web_site.backend.users.operations import get_user_repository, get_user_by_id
from mp_web_site.backend.users.roles import UserRole, ROLE_HIERARCHY

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/sign-in")

@lru_cache()
def get_jwt_settings() -> JWTSettings:
  """Get DynamoDB settings from environment variables."""
  return JWTSettings()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    settings = get_jwt_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    settings = get_jwt_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, settings.algorithm)
    return encoded_jwt


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


def get_current_user(token: str = Depends(oauth2_scheme), repo: UserRepository =Depends(get_user_repository)):
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id: str = payload.get("sub")
    user = get_user_by_id(user_id, repo)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


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