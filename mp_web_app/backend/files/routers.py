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
  user=Depends(role_required([UserRole.ADMIN, UserRole.ACCOUNTANT])),
):
  try:
    # Accountants can only upload accounting documents
    if user.role == UserRole.ACCOUNTANT.value and file_type != FileType.accounting:
      raise HTTPException(
        status_code=403, detail="Accountants can only upload accounting documents"
      )
    
    file_metadata = FileMetadataFull(
      file_name=file_name, file_type=file_type, allowed_to=allowed_to, uploaded_by=user.id
    )
    return upload_file(file_metadata=file_metadata, file=file, user_id=user.id, repo=repo)
  except MissingAllowedUsersError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except InvalidFileExtensionError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except FileUploadError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except MetadataError as e:
    raise HTTPException(status_code=500, detail=str(e))


@file_router.get("/list", status_code=status.HTTP_200_OK)
async def files_list(
  file_type: str,
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.REGULAR_USER, UserRole.ACCOUNTANT, UserRole.BOARD, UserRole.CONTROL, UserRole.ADMIN])),
):
  try:
    # Accountants can only list accounting documents
    if user.role == UserRole.ACCOUNTANT.value and file_type != "accounting":
      raise HTTPException(
        status_code=403, detail="Accountants can only access accounting documents"
      )
    
    # Regular users cannot list accounting documents
    if user.role == UserRole.REGULAR_USER.value and file_type == "accounting":
      raise HTTPException(
        status_code=403, detail="You don't have access to this document type"
      )
    
    return get_files_metadata(file_type, repo)
  except MetadataError as e:
    raise HTTPException(status_code=500, detail=str(e))


@file_router.delete("/delete/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def file_delete(
  file_id: str,
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.ADMIN, UserRole.ACCOUNTANT])),
):
  """Delete a single file by ID (ADMIN and ACCOUNTANT)."""
  try:
    # Accountants can only delete accounting documents
    if user.role == UserRole.ACCOUNTANT.value:
      response = repo.table.get_item(Key={"id": file_id})
      if "Item" not in response:
        raise HTTPException(status_code=404, detail="File not found")
      
      file_metadata = repo.convert_item_to_object_full(response["Item"])
      if file_metadata.file_type != FileType.accounting:
        raise HTTPException(
          status_code=403, detail="Accountants can only delete accounting documents"
        )
    
    delete_file(file_id, repo)
  except FileNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
  except FileUploadError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except MetadataError as e:
    raise HTTPException(status_code=500, detail=str(e))


@file_router.post("/download", status_code=status.HTTP_200_OK)
async def download_files(
  file_metadata: FileMetadata | list[FileMetadata],
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.REGULAR_USER])),
):
  try:
    return download_file(file_metadata=file_metadata, repo=repo, user=user)
  except FileAccessDeniedError as e:
    raise HTTPException(status_code=403, detail=str(e))
  except FileNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
  except MetadataError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except InvalidMetadataError as e:
    raise HTTPException(status_code=400, detail=str(e))
