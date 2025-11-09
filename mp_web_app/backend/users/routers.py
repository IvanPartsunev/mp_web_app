
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import EmailStr
from starlette.responses import RedirectResponse

from app_config import FRONTEND_BASE_URL
from auth.operations import decode_token, is_token_expired, role_required
from database.repositories import MemberRepository, UserRepository
from mail.operations import construct_verification_link, send_verification_email
from users.models import User, Member, UserCreate, UserUpdate, UserUpdatePassword
from users.operations import (
  create_user,
  create_member,
  delete_user,
  get_user_by_email,
  get_user_by_id,
  get_member_codes,
  get_user_repository,
  list_users,
  update_user,
  update_member_code,
  update_user_password,
  member_code_valid,
)
from users.roles import UserRole

user_router = APIRouter(tags=["users"])

@user_router.get("/list-users", response_model=list[User], status_code=status.HTTP_200_OK)
async def users_list(
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(role_required([UserRole.REGULAR_USER]))
):
  return list_users(user_repo)


@user_router.get("/board-members", response_model=list[User], status_code=status.HTTP_200_OK)
async def board_members_list(
  user_repo: UserRepository = Depends(get_user_repository)
):
  """Public endpoint to get board members."""
  all_users = list_users(user_repo)
  return [user for user in all_users if user.role == UserRole.BOARD]


@user_router.get("/control-members", response_model=list[User], status_code=status.HTTP_200_OK)
async def control_members_list(
  user_repo: UserRepository = Depends(get_user_repository)
):
  """Public endpoint to get control members."""
  all_users = list_users(user_repo)
  return [user for user in all_users if user.role == UserRole.CONTROL]


@user_router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def user_register(
  request: Request,
  user_data: UserCreate,
  user_repo: UserRepository = Depends(get_user_repository),
  member_repo: MemberRepository = Depends(get_member_codes)
):
  """Create a new user."""

  existing_user = get_user_by_email(user_data.email, user_repo)
  if existing_user:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="User with this email already exists"
    )

  member_code = user_data.member_code
  is_valid = member_code_valid(member_code, member_repo)
  if not is_valid:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="User code don't exists or its already used"
    )

  try:
    user = create_user(user_data, request, user_repo)
    # verification_link = construct_verification_link(user.id, user.email, request)
    # send_verification_email(user.email, verification_link)
    update_member_code(member_code, member_repo)
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


@user_router.post("/create_members", status_code=status.HTTP_201_CREATED)
async def member_create(
  members: list[Member],
  member_repo: MemberRepository = Depends(get_member_codes),
  user=Depends(role_required([UserRole.ADMIN]))
):
  for member in members:
    create_member(code, member_repo)


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

