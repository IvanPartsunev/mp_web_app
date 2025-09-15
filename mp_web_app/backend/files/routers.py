from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form

from auth.operations import role_required
from database.operations import UploadsRepository
from files.models import FileMetadata, FileType
from files.operations import upload_file, get_uploads_repository, delete_file, get_files_metadata
from users.roles import UserRole

file_router = APIRouter(tags=["files"])


@file_router.post("/upload")
async def upload_files(
    file_name: str = Form(...),
    file_type: FileType = Form(...),
    allowed_to: List[str] = Form([]),
    file: UploadFile = File(...),
    repo: UploadsRepository = Depends(get_uploads_repository),
    user=Depends(role_required([UserRole.REGULAR_USER])) # TODO Change to ADMIN
):
  file_metadata = FileMetadata(file_name=file_name, file_type=file_type, allowed_to=allowed_to, uploaded_by=user.id)
  upload_file(file_metadata, file, repo)
  return HTTPException(status_code=201, detail=f"File: {file_name} uploaded")


@file_router.get("/get_files")
async def get_files(
    prefix: str, #file_type
    repo: UploadsRepository = Depends(get_uploads_repository),
    user=Depends(role_required([UserRole.REGULAR_USER])) # TODO Change to ADMIN
):
  return get_files_metadata(prefix, repo)


@file_router.post("/delete_files")
async def delete_files(
    files_metadata: List[FileMetadata],
    repo: UploadsRepository = Depends(get_uploads_repository),
    user=Depends(role_required([UserRole.REGULAR_USER])) # TODO Change to ADMIN
):
  delete_file(files_metadata, repo)
  file_names = [file.file_name for file in files_metadata]
  return HTTPException(status_code=204, detail=f"File/s: {', '.join(file_names)} deleted")
