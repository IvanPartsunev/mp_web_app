from datetime import datetime
from typing import Union

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from auth.operations import role_required
from database.exceptions import DatabaseError
from database.repositories import MemberRepository
from members.exceptions import InvalidFileTypeError
from members.models import Member, MemberPublic, MemberProxy
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

PRIVILEGED_ROLES = [UserRole.ADMIN, UserRole.BOARD, UserRole.CONTROL]

@member_router.get("/list/members", response_model=Union[list[Member], list[MemberPublic]], status_code=status.HTTP_200_OK)
async def members_list_members(
  member_repo: MemberRepository = Depends(get_member_repository),
  current_user: User = Depends(role_required([UserRole.REGULAR_USER])),
):
  """
  List all members.

  Access:
  - All authenticated users can access this endpoint
  - ADMIN, BOARD, CONTROL: See full details (name, email, phone, member_code)
  - REGULAR_USER, ACCOUNTANT:
    - See only names (first_name, middle_name, last_name) and role (proxy, board or control)
  """
  try:
    user_role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)
    members = list_members(member_repo)

    if user_role in PRIVILEGED_ROLES:
      # Admin, Board, Control see everything
      return members
    else:
      # For member list: all logged users see only names and role (proxy, board or control)
      return [
        MemberPublic(
          first_name=m.first_name,
          middle_name=m.middle_name,
          last_name=m.last_name,
          proxy=m.proxy,
          board=m.board,
          control=m.control
        )
        for m in members
      ]
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@member_router.get("/list/proxy", response_model=Union[list[Member], list[MemberProxy]], status_code=status.HTTP_200_OK)
async def members_list_proxy(
  member_repo: MemberRepository = Depends(get_member_repository),
  current_user: User = Depends(role_required([UserRole.REGULAR_USER])),
):
  """
  List all proxes.

  Access:
  - All authenticated users can access this endpoint
  - ADMIN, BOARD, CONTROL: See full details (name, email, phone, member_code)
  - REGULAR_USER:
    - See only names, emails (first_name, middle_name, last_name, email) and role (proxy, board or control)
  """
  try:
    user_role = current_user.role if isinstance(current_user.role, UserRole) else UserRole(current_user.role)
    members = list_members(member_repo, proxy_only=True)

    if user_role in PRIVILEGED_ROLES:
      # Admin, Board, Control see everything
      return members
    else:
      # For member list: all logged users see only names and role (proxy, board or control)
      return [
        MemberProxy(
          first_name=m.first_name,
          middle_name=m.middle_name,
          last_name=m.last_name,
          email=m.email,
          proxy=m.proxy,
          board=m.board,
          control=m.control
        )
        for m in members
      ]
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@member_router.get("/list/{governance}", response_model=Union[list[Member]], status_code=status.HTTP_200_OK)
async def members_list_governance(
  governance: str,
  member_repo: MemberRepository = Depends(get_member_repository),
  user=Depends(role_required([UserRole.REGULAR_USER, UserRole.ACCOUNTANT])),
):
  """
  List all members.

  Access:
  - All authenticated users can access this endpoint
  """
  if governance.lower() not in ["board", "control"]:
    raise HTTPException(status_code=400, detail="Governance must be eather `board` or `control`.")

  board = True if governance.lower() == "board" else False
  control = True if governance.lower() == "control" else False

  try:
    return list_members(member_repo, board_only=board, control_only=control)
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@member_router.get(path="/list/{type}", response_model=Union[list[Member], list[MemberPublic]], status_code=status.HTTP_200_OK)

@member_router.get("/export", status_code=status.HTTP_200_OK)
async def members_export(
  member_repo: MemberRepository = Depends(get_member_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Export all members as a CSV file (ADMIN only). Compatible with /sync_members upload."""
  try:
    csv_bytes = members_list_to_csv(member_repo)
    return StreamingResponse(
      csv_bytes,
      media_type="text/csv",
      headers={"Content-Disposition": f"attachment; filename={datetime.now().strftime('%Y%m%d')}_members.csv"},
    )
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))


@member_router.post("/sync_members", status_code=status.HTTP_200_OK)
async def members_upload(
  file: UploadFile,
  member_repo: MemberRepository = Depends(get_member_repository),
  user=Depends(role_required([UserRole.ADMIN])),
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
