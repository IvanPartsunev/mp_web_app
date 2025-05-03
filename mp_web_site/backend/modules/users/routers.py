from fastapi import APIRouter
from fastapi.responses import HTMLResponse

user_router = APIRouter()
@user_router.post("/sign-up")
def user_sign_up():
  pass


@user_router.post("/sign-in")
def user_sign_in():
  pass


@user_router.post("/reset-password")
def user_reset_password():
  pass


@user_router.post("/activate-account")
def user_activate_account():
  pass


from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from mp_web_site.mp_api.modules.users.schemas import User, UserCreate, UserUpdate
from mp_web_site.mp_api.modules.users.repository import UserRepository

router = APIRouter(prefix="/users", tags=["users"])


def get_user_repository():
  """Dependency to get the user repository."""
  repo = UserRepository()
  # Ensure the table exists
  repo.create_table_if_not_exists()
  return repo


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
  user_data: UserCreate,
  repo: UserRepository = Depends(get_user_repository)
):
  """Create a new user."""
  # Check if user with this email already exists
  existing_user = await repo.get_user_by_email(user_data.email)
  if existing_user:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="User with this email already exists"
    )

  return await repo.create_user(user_data)


@router.get("/{user_id}", response_model=User)
async def get_user(
  user_id: str,
  repo: UserRepository = Depends(get_user_repository)
):
  """Get a user by ID."""
  user = await repo.get_user_by_id(user_id)
  if not user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )
  return user


@router.get("/by-email/{email}", response_model=User)
async def get_user_by_email(
  email: str,
  repo: UserRepository = Depends(get_user_repository)
):
  """Get a user by email."""
  user = await repo.get_user_by_email(email)
  if not user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )
  return user


@router.get("/", response_model=List[User])
async def list_users(
  repo: UserRepository = Depends(get_user_repository)
):
  """List all users."""
  return await repo.list_users()


@router.put("/{user_id}", response_model=User)
async def update_user(
  user_id: str,
  user_data: UserUpdate,
  repo: UserRepository = Depends(get_user_repository)
):
  """Update a user."""
  user = await repo.update_user(user_id, user_data)
  if not user:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )
  return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
  user_id: str,
  repo: UserRepository = Depends(get_user_repository)
):
  """Delete a user."""
  success = await repo.delete_user(user_id)
  if not success:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail="User not found"
    )
  return None
