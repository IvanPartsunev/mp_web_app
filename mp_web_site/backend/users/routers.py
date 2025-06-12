from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import EmailStr

from mp_web_site.backend.auth.models import Token
from mp_web_site.backend.auth.operations import authenticate_user
from mp_web_site.backend.auth.operations import (
  generate_access_token,
  generate_refresh_token,
  role_required,
  get_auth_repository,
  decode_token, is_token_expired
)
from mp_web_site.backend.database.operations import UserRepository, AuthRepository
from mp_web_site.backend.mail.operations import construct_verification_link, send_verification_email
from mp_web_site.backend.users.models import UserCreate, User, UserUpdate
from mp_web_site.backend.users.operations import (
  get_user_repository,
  get_user_by_email,
  create_user,
  update_user
)
from mp_web_site.backend.users.roles import UserRole

user_router = APIRouter(tags=["users"])

user_repository = UserRepository()


@user_router.post("/sign-up", response_model=User, status_code=status.HTTP_201_CREATED)
async def sign_up(
  request: Request,
  user_data: UserCreate,
  repo: UserRepository = Depends(get_user_repository)
):
  """Create a new user."""
  # TODO: Consider make "migrations" class for db tables instead of creating table if dont exists.
  # user_repository.create_table_if_not_exists()
  # Check if user with this email already exists
  existing_user = get_user_by_email(user_data.email, repo)
  if existing_user:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="User with this email already exists"
    )

  user = create_user(user_data, request, repo)
  verification_link = construct_verification_link(user.id, user.email, request)
  send_verification_email(user.email, verification_link)

  return user


@user_router.post("/sign-in", response_model=Token)
async def user_sign_in(
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


@user_router.post("/reset-password")
async def user_reset_password(user=Depends(role_required([UserRole.REGULAR_USER]))):
  raise HTTPException(status_code=status.HTTP_202_ACCEPTED)


@user_router.get("/activate-account", response_model=User, status_code=status.HTTP_201_CREATED)
async def user_activate_account(email: EmailStr | str, token: str, repo: UserRepository = Depends(get_user_repository)):
  user_data = UserUpdate(active=True)
  payload = decode_token(token)
  user_id = payload.get("user_id")

  if not is_token_expired(token) and email == payload.get("sub") and payload.get("type") == "activation":
    return update_user(user_id, email, user_data, repo)
  raise HTTPException(status_code=status.HTTP_409_CONFLICT)

# TODO: Assess the need of separate endpoints for getting use by email, id ect. or all to be combined in get_user.
# @router.get("/{user_id}", response_model=User)
# async def get_user(
#   user_id: str,
#   repo: UserRepository = Depends(get_user_repository)
# ):
#   """Get a user by ID."""
#   user = await repo.get_user_by_id(user_id)
#   if not user:
#     raise HTTPException(
#       status_code=status.HTTP_404_NOT_FOUND,
#       detail="User not found"
#     )
#   return user


# TODO: Is getting user by email needed???
# @router.get("/by-email/{email}", response_model=User)
# async def get_user_by_email(
#   email: str,
#   repo: UserRepository = Depends(get_user_repository)
# ):
#   """Get a user by email."""
#   user = await repo.get_user_by_email(email)
#   if not user:
#     raise HTTPException(
#       status_code=status.HTTP_404_NOT_FOUND,
#       detail="User not found"
#     )
#   return user


# @router.get("/", response_model=List[User])
# async def list_users(
#   repo: UserRepository = Depends(get_user_repository)
# ):
#   """List all users."""
#   return await repo.list_users()
#
#
# @router.put("/{user_id}", response_model=User)
# async def update_user(
#   user_id: str,
#   user_data: UserUpdate,
#   repo: UserRepository = Depends(get_user_repository)
# ):
#   """Update a user."""
#   user = await repo.update_user(user_id, user_data)
#   if not user:
#     raise HTTPException(
#       status_code=status.HTTP_404_NOT_FOUND,
#       detail="User not found"
#     )
#   return user
#
#
# @router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_user(
#   user_id: str,
#   repo: UserRepository = Depends(get_user_repository)
# ):
#   """Delete a user."""
#   success = await repo.delete_user(user_id)
#   if not success:
#     raise HTTPException(
#       status_code=status.HTTP_404_NOT_FOUND,
#       detail="User not found"
#     )
#   return None
