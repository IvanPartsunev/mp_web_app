from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import EmailStr
from starlette.responses import RedirectResponse

from app_config import FRONTEND_BASE_URL
from auth.operations import decode_token, get_current_user, is_token_expired, role_required
from database.repositories import MemberRepository, UserRepository
from mail.operations import construct_verification_link, send_verification_email
from members.operations import get_member_repository, is_member_code_valid, update_member_code
from users.exceptions import DatabaseError, UserNotFoundError, ValidationError
from users.models import User, UserCreate, UserUpdate, UserUpdatePassword
from users.operations import (
  create_user,
  delete_user,
  get_user_by_email,
  get_user_by_id,
  get_user_repository,
  list_users,
  update_user,
  update_user_password,
)
from users.roles import UserRole

user_router = APIRouter(tags=["users"])


@user_router.get("/me", response_model=User, status_code=status.HTTP_200_OK)
async def get_me(current_user: User = Depends(get_current_user)):
  """Get current authenticated user information."""
  return current_user


@user_router.get("/list", response_model=list[User], status_code=status.HTTP_200_OK)
async def users_list(
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(role_required([UserRole.REGULAR_USER, UserRole.ACCOUNTANT])),
):
  try:
    return list_users(user_repo)
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@user_router.get("/board", response_model=list[User], status_code=status.HTTP_200_OK)
async def board_members_list(user_repo: UserRepository = Depends(get_user_repository)):
  """Public endpoint to get board members."""
  try:
    all_users = list_users(user_repo)
    return [user for user in all_users if user.role == UserRole.BOARD]
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@user_router.get("/control", response_model=list[User], status_code=status.HTTP_200_OK)
async def control_members_list(user_repo: UserRepository = Depends(get_user_repository)):
  """Public endpoint to get control members."""
  try:
    all_users = list_users(user_repo)
    return [user for user in all_users if user.role == UserRole.CONTROL]
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@user_router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def user_register(
  request: Request,
  user_data: UserCreate,
  user_repo: UserRepository = Depends(get_user_repository),
  member_repo: MemberRepository = Depends(get_member_repository),
):
  """Create a new user."""

  existing_user = get_user_by_email(user_data.email, user_repo)
  if existing_user:
    raise HTTPException(status_code=400, detail="User with this email already exists")

  member_code = user_data.member_code
  is_valid = is_member_code_valid(member_code, member_repo)
  if not is_valid:
    raise HTTPException(status_code=400, detail="User code don't exists or its already used")

  try:
    user = create_user(user_data, request, user_repo)
    verification_link = construct_verification_link(user.id, user.email, request)
    send_verification_email(user.email, verification_link)
    update_member_code(member_code, member_repo)
  except ValidationError as e:
    try:
      delete_user(user_data.email, user_repo)
    except (UserNotFoundError, DatabaseError):
      pass  # Ignore cleanup errors
    raise HTTPException(status_code=400, detail=str(e))
  except DatabaseError as e:
    try:
      delete_user(user_data.email, user_repo)
    except (UserNotFoundError, DatabaseError):
      pass  # Ignore cleanup errors
    raise HTTPException(status_code=500, detail=str(e))
  except Exception as e:
    try:
      delete_user(user_data.email, user_repo)
    except (UserNotFoundError, DatabaseError):
      pass  # Ignore cleanup errors
    raise HTTPException(status_code=400, detail=str(e))
  return user


@user_router.post("/reset-password")
async def user_reset_password(user_data: UserUpdatePassword, user_repo: UserRepository = Depends(get_user_repository)):
  token = user_data.token
  payload = decode_token(token)
  user_id = payload.get("user_id")
  email = payload.get("sub")

  if not is_token_expired(token) and email == payload.get("sub") and payload.get("type") == "reset":
    try:
      return update_user_password(user_id, email, user_data, user_repo)
    except UserNotFoundError as e:
      raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
      raise HTTPException(status_code=400, detail=str(e))
    except DatabaseError as e:
      raise HTTPException(status_code=500, detail=str(e))
  raise HTTPException(status_code=409, detail="Invalid or expired token")


@user_router.get("/activate-account")
async def user_activate_account(
  email: EmailStr | str, token: str, user_repo: UserRepository = Depends(get_user_repository)
):
  payload = decode_token(token)
  user_id = payload.get("user_id")

  if not is_token_expired(token) and email == payload.get("sub") and payload.get("type") == "activation":
    try:
      user_data = UserUpdate(active=True)
      update_user(user_id, email, user_data, user_repo)
      return RedirectResponse(url=f"{FRONTEND_BASE_URL}/login", status_code=status.HTTP_302_FOUND)
    except UserNotFoundError as e:
      raise HTTPException(status_code=404, detail=str(e))
    except DatabaseError as e:
      raise HTTPException(status_code=500, detail=str(e))

  raise HTTPException(status_code=403, detail="Invalid or expired token")


@user_router.put("/update/{user_id}", response_model=User, status_code=status.HTTP_200_OK)
async def user_update(
  user_id: str,
  user_data: UserUpdate,
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Update a user (ADMIN only)."""
  try:
    # Validate role if provided
    if user_data.role is not None:
      valid_roles = [role.value for role in UserRole]
      if user_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    # Get user by ID to get their email
    existing_user = get_user_by_id(user_id, user_repo)
    return update_user(user_id, existing_user.email, user_data, user_repo)
  except UserNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
  except ValidationError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@user_router.delete("/delete/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def user_delete(
  user_id: str, user_repo: UserRepository = Depends(get_user_repository), user=Depends(role_required([UserRole.ADMIN]))
):
  """Delete a user (ADMIN only)."""
  # Prevent admin from deleting themselves
  if user.id == user_id:
    raise HTTPException(status_code=400, detail="Cannot delete your own account")

  try:
    # Get user by ID to get their email
    existing_user = get_user_by_id(user_id, user_repo)
    delete_user(existing_user.email, user_repo)
  except UserNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))
