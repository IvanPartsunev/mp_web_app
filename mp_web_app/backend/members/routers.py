from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File

from auth.operations import role_required
from database.repositories import MemberRepository
from members.operations import get_member_repository, create_member, is_valid_file_type
from users.models import Member
from users.roles import UserRole

member_router = APIRouter(tags=['member'])

@member_router.post("/create_members", status_code=status.HTTP_201_CREATED)
async def member_create(
  member: Member,
  member_repo: MemberRepository = Depends(get_member_repository),
  user=Depends(role_required([UserRole.ADMIN]))
):
  try:
    create_member(member, member_repo)
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))


@member_router.post("/upload_members_list", status_code=status.HTTP_200_OK)
async def members_upload(
  file: UploadFile,
  # user = Depends(role_required([UserRole.ADMIN]))
):

  try:
    file_name = file.filename
    is_valid_file_type(file_name)
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
