from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from starlette import status

from auth.operations import role_required
from database.operations import UploadsRepository
from files.models import FileMetadata, FileType
from files.operations import upload_to_s3, get_uploads_repository
from users.operations import get_user_repository
from users.roles import UserRole

file_router = APIRouter(tags=["files"])

@file_router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_files(
    file_name: str = Form(...),
    file_type: FileType = Form(...),
    allowed_to: List[str] = Form([]),
    file: UploadFile = File(...),
    repo: UploadsRepository = Depends(get_uploads_repository),
    # user=Depends(role_required([UserRole.REGULAR_USER])) #TODO Change this to Admin
):
  file_metadata = FileMetadata(file_name=file_name, file_type=file_type, allowed_to=allowed_to)
  upload_to_s3(file_metadata, file, repo)
  return HTTPException(status_code=201, detail=f"File: {file_name} uploaded")


@file_router.get("/get_files")
async def get_files():
  return HTTPException(status_code=204, detail="Not implemented")


@file_router.post("/delete_files")
async def delete_files():
  return HTTPException(status_code=204, detail="Not implemented")