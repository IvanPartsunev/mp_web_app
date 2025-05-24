from fastapi import APIRouter, HTTPException, status, Request, Response, Depends, Cookie
from mp_web_site.backend.auth.models import TokenRefreshRequest, Token
from mp_web_site.backend.auth.operations import verify_refresh_token, create_access_token, create_refresh_token, \
  get_auth_repository
from mp_web_site.backend.database.operations import AuthRepository

auth_router = APIRouter(tags=["auth"])


@auth_router.post("/auth/refresh", response_model=Token)
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

  new_access_token = create_access_token({"sub": payload.sub, "role": payload.role})
  new_refresh_token = create_refresh_token({"sub": payload.sub, "role": payload.role}, auth_repo)

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
