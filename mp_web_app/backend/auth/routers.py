from fastapi import APIRouter, HTTPException, Response, Depends, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from starlette import status

from auth.models import Token
from auth.operations import (
  verify_refresh_token,
  generate_access_token,
  generate_refresh_token,
  get_auth_repository,
  invalidate_token, authenticate_user,
)
from database.operations import AuthRepository, UserRepository
from users.operations import get_user_repository

auth_router = APIRouter(tags=["auth"])


@auth_router.post("/login", response_model=Token)
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

  response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,
    secure=True,
    samesite="strict",
    max_age=7 * 24 * 60 * 60,
  )
  return Token(access_token=access_token, refresh_token=refresh_token)


@auth_router.post("/refresh", response_model=Token)
async def refresh(
  response: Response,
  refresh_token: str = Cookie(None),  # Prefer HTTP-only cookie
  auth_repo: AuthRepository = Depends(get_auth_repository),
):
  if not refresh_token:
    raise HTTPException(status_code=401, detail="Missing refresh token")

  payload = verify_refresh_token(refresh_token)
  if not payload:
    raise HTTPException(status_code=401, detail="Invalid refresh token")

  invalidate_token(payload, auth_repo)

  new_access_token = generate_access_token({"sub": payload.sub, "role": payload.role})
  new_refresh_token = generate_refresh_token({"sub": payload.sub, "role": payload.role}, auth_repo)

  response.set_cookie(
    key="refresh_token",
    value=new_refresh_token,
    httponly=True,
    secure=True,
    samesite="strict",
    max_age=7 * 24 * 60 * 60,
  )
  return Token(
    access_token=new_access_token,
    refresh_token=new_refresh_token,
  )
