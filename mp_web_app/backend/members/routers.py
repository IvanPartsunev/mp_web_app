from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from auth.operations import role_required
from database.repositories import MemberRepository
from members.exceptions import DatabaseError, InvalidFileTypeError, MemberNotFoundError, ValidationError
from members.models import Member, MemberUpdate
from members.operations import (
  convert_members_list,
  create_member,
  delete_member,
  get_member_repository,
  is_valid_file_type,
  list_members,
  sync_members_list,
  update_member,
)
from users.roles import UserRole

member_router = APIRouter(tags=["member"])


@member_router.get("/list", response_model=list[Member], status_code=status.HTTP_200_OK)
async def members_list(
  member_repo: MemberRepository = Depends(get_member_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """List all members (ADMIN only)."""
  try:
    return list_members(member_repo)
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@member_router.post("/create_members", status_code=status.HTTP_201_CREATED)
async def member_create(
  member: Member,
  member_repo: MemberRepository = Depends(get_member_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    create_member(member, member_repo)
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))


@member_router.put("/update/{member_code}", response_model=Member, status_code=status.HTTP_200_OK)
async def member_update(
  member_code: str,
  member_data: MemberUpdate,
  member_repo: MemberRepository = Depends(get_member_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Update member email and phone (ADMIN only)."""
  try:
    return update_member(member_code, member_data, member_repo)
  except MemberNotFoundError as e:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
  except ValidationError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
  except DatabaseError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@member_router.delete("/delete/{member_code}", status_code=status.HTTP_204_NO_CONTENT)
async def member_delete(
  member_code: str,
  member_repo: MemberRepository = Depends(get_member_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Delete a member (ADMIN only)."""
  try:
    delete_member(member_code, member_repo)
  except MemberNotFoundError as e:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
  except DatabaseError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@member_router.post("/sync_members_list", status_code=status.HTTP_200_OK)
async def members_upload(
  file: UploadFile,
  member_repo: MemberRepository = Depends(get_member_repository),
  # user = Depends(role_required([UserRole.ADMIN]))
):
  try:
    file_name = file.filename
    is_valid_file_type(file_name)
    data = await convert_members_list(file)
    sync_members_list(data, member_repo)
  except InvalidFileTypeError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))
