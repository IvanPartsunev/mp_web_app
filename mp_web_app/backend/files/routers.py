from typing import List

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form, status

from auth.operations import role_required
from database.operations import UploadsRepository
from files.models import FileMetadata, FileType, FileMetadataFull
from files.operations import upload_file, get_uploads_repository, delete_file, get_files_metadata, download_file
from users.roles import UserRole

file_router = APIRouter(tags=["files"])


@file_router.post("/upload", response_model=FileMetadata, status_code=status.HTTP_201_CREATED)
async def upload_files(
    file_name: str = Form(...),
    file_type: FileType = Form(...),
    allowed_to: List[str] = Form([]),
    file: UploadFile = File(...),
    repo: UploadsRepository = Depends(get_uploads_repository),
    user=Depends(role_required([UserRole.REGULAR_USER])) # TODO Change to ADMIN
):
  file_metadata = FileMetadataFull(file_name=file_name, file_type=file_type, allowed_to=allowed_to, uploaded_by=user.id)
  upload_file(file_metadata=file_metadata, file=file, user_id=user.id, repo=repo)


@file_router.get("/get_files", status_code=status.HTTP_200_OK)
async def get_files(
    file_type: str,
    repo: UploadsRepository = Depends(get_uploads_repository),
    user=Depends(role_required([UserRole.REGULAR_USER])) # TODO Change to ADMIN
):
  return get_files_metadata(file_type, repo)


@file_router.post("/delete_files", status_code=status.HTTP_204_NO_CONTENT)
async def delete_files(
    files_metadata: List[FileMetadata],
    repo: UploadsRepository = Depends(get_uploads_repository),
    user=Depends(role_required([UserRole.REGULAR_USER])) # TODO Change to ADMIN
):
  delete_file(files_metadata, repo)
  file_names = [file.file_name for file in files_metadata]
  return f"Deleted file names: {', '.join(file_names)}"


@file_router.post("/download", status_code=status.HTTP_200_OK)
async def download_files(
    file_metadata: FileMetadata | List[FileMetadata],
    repo: UploadsRepository = Depends(get_uploads_repository),
    user = Depends(role_required([UserRole.REGULAR_USER]))
):
  return download_file(file_metadata=file_metadata, repo=repo, user_id=user.id)