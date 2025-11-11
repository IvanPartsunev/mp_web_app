from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from auth.operations import role_required
from database.repositories import MemberRepository
from members.models import Member
from members.operations import (
  convert_members_list,
  create_member,
  get_member_repository,
  is_valid_file_type,
  sync_members_list,
)
from users.roles import UserRole

member_router = APIRouter(tags=["member"])


@member_router.post("/create_members", status_code=status.HTTP_201_CREATED)
async def member_create(
  member: Member,
  member_repo: MemberRepository = Depends(get_member_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    create_member(member, member_repo)
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))


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
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
