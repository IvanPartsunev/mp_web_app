from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from auth.operations import role_required
from database.repositories import FileMetadataRepository
from files.exceptions import (
  FileAccessDeniedError,
  FileNotFoundError,
  FileUploadError,
  InvalidFileExtensionError,
  InvalidMetadataError,
  MetadataError,
  MissingAllowedUsersError,
)
from files.models import FileMetadata, FileMetadataFull, FileType
from files.operations import delete_file, download_file, get_files_metadata, get_uploads_repository, upload_file
from users.roles import UserRole

file_router = APIRouter(tags=["files"])


@file_router.post("/create", response_model=FileMetadata, status_code=status.HTTP_201_CREATED)
async def file_create(
  file_name: str = Form(...),
  file_type: FileType = Form(...),
  allowed_to: list[str] = Form([]),
  file: UploadFile = File(...),
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    file_metadata = FileMetadataFull(
      file_name=file_name, file_type=file_type, allowed_to=allowed_to, uploaded_by=user.id
    )
    return upload_file(file_metadata=file_metadata, file=file, user_id=user.id, repo=repo)
  except MissingAllowedUsersError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
  except InvalidFileExtensionError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
  except FileUploadError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
  except MetadataError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@file_router.get("/list", status_code=status.HTTP_200_OK)
async def files_list(
  file_type: str,
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    return get_files_metadata(file_type, repo)
  except MetadataError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@file_router.delete("/delete/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def file_delete(
  file_id: str,
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Delete a single file by ID (ADMIN only)."""
  try:
    delete_file(file_id, repo)
  except FileNotFoundError as e:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
  except FileUploadError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
  except MetadataError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@file_router.post("/download", status_code=status.HTTP_200_OK)
async def download_files(
  file_metadata: FileMetadata | list[FileMetadata],
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.REGULAR_USER])),
):
  try:
    return download_file(file_metadata=file_metadata, repo=repo, user=user)
  except FileAccessDeniedError as e:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
  except FileNotFoundError as e:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
  except MetadataError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
  except InvalidMetadataError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
