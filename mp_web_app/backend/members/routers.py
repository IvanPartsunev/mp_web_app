from typing import Union
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from auth.operations import get_current_user, role_required
from database.exceptions import DatabaseError
from database.repositories import MemberRepository
from members.exceptions import InvalidFileTypeError, MemberNotFoundError, ValidationError
from members.models import Member, MemberPublic, MemberUpdate
from members.operations import (
  convert_members_list,
  get_member_repository,
  is_valid_file_type,
  list_members,
  members_list_to_csv,
  sync_members_list,
)
from users.models import User
from users.roles import UserRole

member_router = APIRouter(tags=["member"])


@member_router.get("/list", response_model=Union[list[Member], list[MemberPublic]], status_code=status.HTTP_200_OK)
async def members_list(
  proxy_only: bool = False,
  member_repo: MemberRepository = Depends(get_member_repository),
  current_user: User = Depends(get_current_user),
):
  """
  List all members or filter by proxy status.

  Access:
  - All authenticated users can access this endpoint
  - ADMIN, BOARD, CONTROL: See full details (name, email, phone, member_code)
  - REGULAR_USER, ACCOUNTANT:
    - For cooperative members: See only names (first_name, last_name)
    - For proxies: See names + email

  Query Parameters:
  - proxy_only: If True, returns only members with proxy=True. Default is False (returns all members).
  """
  try:
    members = list_members(member_repo, proxy_only=proxy_only)

    privileged_roles = [UserRole.ADMIN, UserRole.BOARD, UserRole.CONTROL]
    user_role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)

    if user_role in privileged_roles:
      # Admin, Board, Control see everything
      return members
    elif proxy_only:
      # For proxies list: all logged users see email (but not phone/member_code)
      return [
        Member(
          first_name=m.first_name,
          last_name=m.last_name,
          email=m.email,
          phone=None,  # Hide phone for regular users
          member_code="",  # Hide member code
          member_code_valid=False,
          proxy=m.proxy,
        )
        for m in members
      ]
    else:
      # For cooperative members: regular users see only names
      return [MemberPublic(first_name=m.first_name, last_name=m.last_name, proxy=m.proxy) for m in members]
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@member_router.get("/export", status_code=status.HTTP_200_OK)
async def members_export(
  member_repo: MemberRepository = Depends(get_member_repository),
  # user=Depends(role_required([UserRole.ADMIN])),
):
  """Export all members as a CSV file (ADMIN only). Compatible with /sync_members upload."""
  try:
    csv_bytes = members_list_to_csv(member_repo)
    return StreamingResponse(
      csv_bytes,
      media_type="text/csv",
      headers={"Content-Disposition": f"attachment; filename={datetime.now().strftime("%Y%m%d")}_members.csv"},
    )
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@member_router.post("/sync_members", status_code=status.HTTP_200_OK)
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
