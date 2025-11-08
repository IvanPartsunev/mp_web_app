
from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from auth.operations import role_required
from database.repositories import UploadsRepository
from files.models import FileMetadata, FileMetadataFull, FileType
from files.operations import delete_file, download_file, get_files_metadata, get_uploads_repository, upload_file
from users.roles import UserRole

file_router = APIRouter(tags=["files"])


@file_router.post("/upload", response_model=FileMetadata, status_code=status.HTTP_201_CREATED)
async def upload_files(
  file_name: str = Form(...),
  file_type: FileType = Form(...),
  allowed_to: list[str] = Form([]),
  file: UploadFile = File(...),
  repo: UploadsRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.REGULAR_USER]))  # TODO Change to ADMIN
):
  file_metadata = FileMetadataFull(file_name=file_name, file_type=file_type, allowed_to=allowed_to, uploaded_by=user.id)
  return upload_file(file_metadata=file_metadata, file=file, user_id=user.id, repo=repo)


@file_router.get("/get_files", status_code=status.HTTP_200_OK)
async def get_files(
  file_type: str,
  repo: UploadsRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.REGULAR_USER]))  # TODO Change to ADMIN
):
  return get_files_metadata(file_type, repo)


@file_router.post("/delete_files", status_code=status.HTTP_204_NO_CONTENT)
async def delete_files(
  files_metadata: list[FileMetadata],
  repo: UploadsRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.REGULAR_USER]))  # TODO Change to ADMIN
):
  delete_file(files_metadata, repo)
  file_names = [file.file_name for file in files_metadata]
  return f"Deleted file names: {', '.join(file_names)}"


@file_router.post("/download", status_code=status.HTTP_200_OK)
async def download_files(
  file_metadata: FileMetadata | list[FileMetadata],
  repo: UploadsRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.REGULAR_USER]))
):
  return download_file(file_metadata=file_metadata, repo=repo, user=user)
