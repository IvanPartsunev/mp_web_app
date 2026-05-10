import os

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status

from auth.operations import role_required
from database.repositories import FileMetadataRepository, UserRepository
from files.exceptions import (
  FileAccessDeniedError,
  FileNotFoundError,
  FileUploadError,
  InvalidFileExtensionError,
  InvalidMetadataError,
  MetadataError,
  MissingAllowedUsersError,
)
from files.models import (
  FileMetadata,
  FileMetadataFull,
  FileType,
  SharedFileAuditEntry,
  ShareFileRequest,
  ShareFileResponse,
)
from files.operations import (
  add_share,
  delete_file,
  download_file,
  get_files_metadata,
  get_files_shared_with_user,
  get_shared_files_audit,
  get_uploads_repository,
  notify_shared_users,
  revoke_share,
  upload_file,
)

USERS_TABLE_NAME = os.environ.get("USERS_TABLE_NAME")


def get_users_repository():
  return UserRepository(USERS_TABLE_NAME)


from users.roles import UserRole

file_router = APIRouter(tags=["files"])


@file_router.post("/create", response_model=FileMetadata, status_code=status.HTTP_201_CREATED)
async def file_create(
  file_name: str = Form(...),
  file_type: FileType = Form(...),
  allowed_to: list[str] = Form([]),
  file: UploadFile = File(...),
  background_tasks: BackgroundTasks = BackgroundTasks(),
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user_repo: UserRepository = Depends(get_users_repository),
  user=Depends(role_required([UserRole.ADMIN, UserRole.ACCOUNTANT])),
):
  try:
    # Accountants can only upload accounting documents
    if user.role == UserRole.ACCOUNTANT.value and file_type != FileType.accounting:
      raise HTTPException(status_code=403, detail="Accountants can only upload accounting documents")

    file_metadata = FileMetadataFull(
      file_name=file_name, file_type=file_type, allowed_to=allowed_to, uploaded_by=user.id
    )
    result = upload_file(file_metadata=file_metadata, file=file, user_id=user.id, repo=repo)
    if result.allowed_to:
      background_tasks.add_task(notify_shared_users, result, user_repo)
    return result
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
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.ACCOUNTANT, UserRole.BOARD, UserRole.CONTROL, UserRole.ADMIN])
  ),
):
  try:
    # Accountants can only list accounting documents
    if user.role == UserRole.ACCOUNTANT.value and file_type != "accounting":
      raise HTTPException(status_code=403, detail="Accountants can only access accounting documents")

    # Regular users cannot list accounting documents
    if user.role == UserRole.REGULAR_USER.value and file_type == "accounting":
      raise HTTPException(status_code=403, detail="You don't have access to this document type")

    include_allowed_to = user.role == UserRole.ADMIN.value
    return get_files_metadata(file_type, repo, user_id=user.id, include_allowed_to=include_allowed_to)
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
        raise HTTPException(status_code=403, detail="Accountants can only delete accounting documents")

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


@file_router.get("/shared-with-me", response_model=list[FileMetadata], status_code=status.HTTP_200_OK)
async def files_shared_with_me(
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.ACCOUNTANT, UserRole.BOARD, UserRole.CONTROL, UserRole.ADMIN])
  ),
):
  """Return all files explicitly shared with the current user (appears in allowed_to)."""
  try:
    return get_files_shared_with_user(user.id, repo)
  except MetadataError as e:
    raise HTTPException(status_code=500, detail=str(e))


@file_router.get("/shared-audit", response_model=list[SharedFileAuditEntry], status_code=status.HTTP_200_OK)
async def shared_files_audit(
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user_repo: UserRepository = Depends(get_users_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Return all files that have been explicitly shared, expanded one row per recipient."""
  try:
    return get_shared_files_audit(repo, user_repo)
  except MetadataError as e:
    raise HTTPException(status_code=500, detail=str(e))


@file_router.delete("/{file_id}/shared-with/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_file_share(
  file_id: str,
  user_id: str,
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Remove a specific user from a file's allowed_to list.
  If the file is a private document and has no remaining recipients, it is deleted.
  """
  try:
    updated_allowed_to = revoke_share(file_id, user_id, repo)

    # Private documents with no remaining recipients are orphaned — delete them
    response = repo.table.get_item(Key={"id": file_id})
    if "Item" in response:
      file_metadata = repo.convert_item_to_object_full(response["Item"])
      if file_metadata.file_type == FileType.private_documents and not updated_allowed_to:
        delete_file(file_id, repo)
  except FileNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
  except MetadataError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except FileUploadError as e:
    raise HTTPException(status_code=500, detail=str(e))


@file_router.patch("/{file_id}/share", response_model=ShareFileResponse, status_code=status.HTTP_200_OK)
async def share_file(
  file_id: str,
  request: ShareFileRequest,
  background_tasks: BackgroundTasks = BackgroundTasks(),
  repo: FileMetadataRepository = Depends(get_uploads_repository),
  user_repo: UserRepository = Depends(get_users_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Add users to a file's allowed_to list. Sends email notifications to newly added users."""
  try:
    updated_allowed_to = add_share(file_id, request.user_ids, repo)

    # Determine which IDs are newly added to notify only them
    existing_ids = set(updated_allowed_to) - set(request.user_ids)
    new_ids = [uid for uid in request.user_ids if uid not in existing_ids]

    if new_ids:
      # Build a minimal FileMetadataFull with only the new recipients for notification
      file_response = repo.table.get_item(Key={"id": file_id})
      if "Item" in file_response:
        file_meta = repo.convert_item_to_object_full(file_response["Item"])
        file_meta.allowed_to = new_ids
        background_tasks.add_task(notify_shared_users, file_meta, user_repo)

    return ShareFileResponse(allowed_to=updated_allowed_to)
  except FileNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
  except MetadataError as e:
    raise HTTPException(status_code=500, detail=str(e))
