from fastapi import APIRouter, HTTPException, Response, Depends, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from starlette import status

from app_config import COOKIE_DOMAIN
from auth.models import Token, TokenPayload
from auth.operations import (
  verify_refresh_token,
  generate_access_token,
  generate_refresh_token,
  get_auth_repository,
  invalidate_token,
  authenticate_user, decode_token,
)
from database.repositories import AuthRepository, UserRepository
from users.operations import get_user_repository

auth_router = APIRouter(tags=["auth"])


@auth_router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
async def login(
  response: Response,
  form_data: OAuth2PasswordRequestForm = Depends(),
  user_repo: UserRepository = Depends(get_user_repository),
  auth_repo: AuthRepository = Depends(get_auth_repository),
):
  user = authenticate_user(form_data.username, form_data.password, user_repo)
  if not user:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

  access_token = generate_access_token({"sub": user.id, "role": user.role})
  refresh_token = generate_refresh_token({"sub": user.id, "role": user.role}, auth_repo)

  # Only set domain if it's not localhost (for production)
  cookie_params = {
    "key": "refresh_token",
    "value": refresh_token,
    "httponly": True,
    "secure": True,
    "samesite": "none",
    "max_age": 7 * 24 * 60 * 60,
  }
  if COOKIE_DOMAIN and COOKIE_DOMAIN != "localhost":
    cookie_params["domain"] = COOKIE_DOMAIN
  
  response.set_cookie(**cookie_params)
  return Token(access_token=access_token, refresh_token=refresh_token)


@auth_router.post("/refresh", response_model=Token, status_code=status.HTTP_200_OK)
async def refresh(
  response: Response,
  refresh_token: str = Cookie(None),  # Prefer HTTP-only cookie
  auth_repo: AuthRepository = Depends(get_auth_repository),
):
  if not refresh_token:
    raise HTTPException(status_code=401, detail="Missing refresh token")

  payload = verify_refresh_token(refresh_token, auth_repo)
  if not payload:
    raise HTTPException(status_code=401, detail="Invalid refresh token")

  invalidate_token(payload, auth_repo)

  new_access_token = generate_access_token({"sub": payload.sub, "role": payload.role})
  new_refresh_token = generate_refresh_token({"sub": payload.sub, "role": payload.role}, auth_repo)

  # Only set domain if it's not localhost (for production)
  cookie_params = {
    "key": "refresh_token",
    "value": new_refresh_token,
    "httponly": True,
    "secure": True,
    "samesite": "none",
    "max_age": 7 * 24 * 60 * 60,
  }
  if COOKIE_DOMAIN and COOKIE_DOMAIN != "localhost":
    cookie_params["domain"] = COOKIE_DOMAIN
  
  response.set_cookie(**cookie_params)
  return Token(
    access_token=new_access_token,
    refresh_token=new_refresh_token,
  )


@auth_router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
  response: Response,
  refresh_token: str = Cookie(None),
  auth_repo: AuthRepository = Depends(get_auth_repository),
):
  payload = decode_token(refresh_token)
  if payload:
    token_payload = TokenPayload(**payload)
    invalidate_token(token_payload, auth_repo)

  # Only set domain if it's not localhost (for production)
  cookie_params = {
    "key": "refresh_token",
    "httponly": True,
    "samesite": "none",
  }
  if COOKIE_DOMAIN and COOKIE_DOMAIN != "localhost":
    cookie_params["domain"] = COOKIE_DOMAIN
  
  response.delete_cookie(**cookie_params)
  return {"msg": "Logged out"}