from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Request

from pydantic import EmailStr
from starlette.responses import RedirectResponse

from app_config import FRONTEND_BASE_URL
from auth.operations import role_required, decode_token, is_token_expired
from database.repositories import UserRepository, UserCodeRepository
from mail.operations import construct_verification_link, send_verification_email
from users.models import UserCreate, User, UserUpdate, UserUpdatePassword, UserCodes
from users.operations import (
  get_user_repository,
  get_user_by_email,
  get_user_by_id,
  create_user,
  update_user, update_user_password, get_user_codes, user_code_valid, create_user_code, update_user_code, delete_user,
  list_users
)
from users.roles import UserRole

user_router = APIRouter(tags=["users"])

@user_router.get("/list-users", response_model=List[User], status_code=status.HTTP_200_OK)
async def users_list(
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(role_required([UserRole.REGULAR_USER]))
):
  return list_users(user_repo)


@user_router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def user_register(
  request: Request,
  user_data: UserCreate,
  user_repo: UserRepository = Depends(get_user_repository),
  user_code_repo: UserCodeRepository = Depends(get_user_codes)
):
  """Create a new user."""

  existing_user = get_user_by_email(user_data.email, user_repo)
  if existing_user:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="User with this email already exists"
    )

  user_code = user_data.user_code
  is_valid = user_code_valid(user_code, user_code_repo)
  if not is_valid:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="User code don't exists or its already used"
    )

  try:
    user = create_user(user_data, request, user_repo)
    verification_link = construct_verification_link(user.id, user.email, request)
    send_verification_email(user.email, verification_link)
    update_user_code(user_code, user_code_repo)
  except Exception as e:
    delete_user(user_data.email, user_repo)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
  return user


@user_router.post("/reset-password")
async def user_reset_password(user_data: UserUpdatePassword,
                              user_repo: UserRepository = Depends(get_user_repository)):
  token = user_data.token
  payload = decode_token(token)
  user_id = payload.get("user_id")
  email = payload.get("sub")

  if not is_token_expired(token) and email == payload.get("sub") and payload.get("type") == "reset":
    return update_user_password(user_id, email, user_data, user_repo)
  raise HTTPException(status_code=status.HTTP_409_CONFLICT)


@user_router.get("/activate-account")
async def user_activate_account(email: EmailStr | str, token: str,
                                user_repo: UserRepository = Depends(get_user_repository)):
  payload = decode_token(token)
  user_id = payload.get("user_id")

  if not is_token_expired(token) and email == payload.get("sub") and payload.get("type") == "activation":
    user_data = UserUpdate(active=True)
    update_user(user_id, email, user_data, user_repo)
    return RedirectResponse(
      url=f"{FRONTEND_BASE_URL}/login",
      status_code=status.HTTP_302_FOUND
    )

  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired token")


@user_router.post("/create_user_codes", status_code=status.HTTP_201_CREATED)
async def create_user_codes(
  codes: UserCodes,
  user_code_repo: UserCodeRepository = Depends(get_user_codes),
  user=Depends(role_required([UserRole.ADMIN]))
):
  for code in codes.codes:
    create_user_code(code, user_code_repo)


@user_router.put("/update/{user_id}", response_model=User, status_code=status.HTTP_200_OK)
async def user_update(
  user_id: str,
  user_data: UserUpdate,
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(role_required([UserRole.ADMIN]))
):
  """Update a user (ADMIN only)."""
  # Get user by ID to get their email
  existing_user = get_user_by_id(user_id, user_repo)
  if not existing_user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )
  
  updated_user = update_user(user_id, existing_user.email, user_data, user_repo)
  if not updated_user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )
  return updated_user


@user_router.delete("/delete/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def user_delete(
  user_id: str,
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(role_required([UserRole.ADMIN]))
):
  """Delete a user (ADMIN only)."""
  # Prevent admin from deleting themselves
  if user.id == user_id:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Cannot delete your own account"
    )
  
  # Get user by ID to get their email
  existing_user = get_user_by_id(user_id, user_repo)
  if not existing_user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )
  
  success = delete_user(existing_user.email, user_repo)
  if not success:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )

