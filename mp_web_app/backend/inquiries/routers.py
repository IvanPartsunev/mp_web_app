import json
import os

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response

from auth.operations import role_required
from database.repositories import InquiryRepository, UserRepository
from inquiries.exceptions import InquiryAccessDeniedError, InquiryNotFoundError, InquiryStatusError
from inquiries.models import AssignEntryNumber, CloseInquiry, Inquiry, InquiryCreate, InquiryUpdate
from inquiries.operations import (
  _notify_involved,
  add_inquiry_files,
  assign_entry_number,
  close_inquiry,
  create_inquiry,
  delete_inquiry,
  export_pdf,
  get_inquiry,
  get_inquiry_repository,
  get_user_repository,
  list_all_inquiries,
  list_inquiries_for_scope,
  list_inquiries_for_user,
  update_inquiry,
)
from users.roles import UserRole

inquiry_router = APIRouter(tags=["inquiries"])

USERS_TABLE_NAME = os.environ.get("USERS_TABLE_NAME")


def _parse_inquiry_create(
  title: str = Form(...),
  description: str = Form(...),
  inquiry_type: str = Form(...),
  scope: str = Form(...),
  co_authors: str = Form("[]"),
) -> InquiryCreate:
  try:
    scope_list = json.loads(scope)
  except Exception:
    raise HTTPException(status_code=400, detail="Invalid scope format — expected a JSON array")
  try:
    co_authors_list = json.loads(co_authors)
  except Exception:
    raise HTTPException(status_code=400, detail="Invalid co_authors format — expected a JSON array")
  return InquiryCreate(
    title=title,
    description=description,
    inquiry_type=inquiry_type,
    scope=scope_list,
    co_authors=co_authors_list,
  )


def _check_visibility(inquiry: Inquiry, user_id: str, user_role: str) -> None:
  if user_role == UserRole.ADMIN:
    return
  if inquiry.author_id == user_id:
    return
  if user_id in (inquiry.co_authors or []):
    return
  if user_role in (inquiry.scope or []):
    return
  raise HTTPException(status_code=403, detail="You do not have access to this inquiry")


@inquiry_router.post("/create", response_model=Inquiry, status_code=status.HTTP_201_CREATED)
async def inquiry_create(
  background_tasks: BackgroundTasks,
  title: str = Form(...),
  description: str = Form(...),
  inquiry_type: str = Form(...),
  scope: str = Form(...),
  co_authors: str = Form("[]"),
  files: list[UploadFile] = File(default=[]),
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.BOARD, UserRole.CONTROL, UserRole.ACCOUNTANT, UserRole.ADMIN])
  ),
):
  data = _parse_inquiry_create(
    title=title, description=description, inquiry_type=inquiry_type, scope=scope, co_authors=co_authors
  )
  try:
    inquiry = create_inquiry(data, files, user.id, repo, user_repo)
    background_tasks.add_task(_notify_involved, inquiry, user_repo)
    return inquiry
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except RuntimeError as e:
    raise HTTPException(status_code=500, detail=str(e))


@inquiry_router.get("/mine", response_model=list[Inquiry], status_code=status.HTTP_200_OK)
async def inquiries_mine(
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.BOARD, UserRole.CONTROL, UserRole.ACCOUNTANT, UserRole.ADMIN])
  ),
):
  return list_inquiries_for_user(user.id, repo, user_repo)


@inquiry_router.get("/addressed-to-me", response_model=list[Inquiry], status_code=status.HTTP_200_OK)
async def inquiries_addressed_to_me(
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(role_required([UserRole.BOARD, UserRole.CONTROL, UserRole.ADMIN])),
):
  return list_inquiries_for_scope(user.role, repo, user_repo)


@inquiry_router.get("/all", response_model=list[Inquiry], status_code=status.HTTP_200_OK)
async def inquiries_all(
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  return list_all_inquiries(repo, user_repo)


# File download — registered before /{inquiry_id} to prevent route shadowing
@inquiry_router.get("/{inquiry_id}/files/{file_key:path}", status_code=status.HTTP_200_OK)
async def inquiry_download_file(
  inquiry_id: str,
  file_key: str,
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.BOARD, UserRole.CONTROL, UserRole.ACCOUNTANT, UserRole.ADMIN])
  ),
):
  """Stream the file from S3 through the backend — avoids S3 CORS issues."""
  import mimetypes
  from urllib.parse import quote

  import boto3
  from botocore.exceptions import ClientError
  from fastapi.responses import StreamingResponse

  from inquiries.operations import BUCKET

  try:
    inquiry = get_inquiry(inquiry_id, repo)
  except InquiryNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))

  _check_visibility(inquiry, user.id, user.role)

  full_key = f"inquiries/{inquiry_id}/{file_key}"
  closing_pdf_key = inquiry.closing_record.pdf_s3_key if inquiry.closing_record else None
  if full_key not in (inquiry.file_s3_keys or []) and full_key != closing_pdf_key:
    raise HTTPException(status_code=404, detail="File not found")

  # Strip UUID prefix to get the original filename
  filename = file_key.split("/")[-1]
  if "_" in filename:
    filename = filename.split("_", 1)[1]

  mime_type, _ = mimetypes.guess_type(filename)
  content_type = mime_type or "application/octet-stream"
  safe_ascii = filename.encode("ascii", errors="replace").decode("ascii")
  content_disposition = f"attachment; filename=\"{safe_ascii}\"; filename*=UTF-8''{quote(filename)}"

  try:
    s3 = boto3.client("s3")
    s3_obj = s3.get_object(Bucket=BUCKET, Key=full_key)
    return StreamingResponse(
      s3_obj["Body"].iter_chunks(chunk_size=65536),
      media_type=content_type,
      headers={"Content-Disposition": content_disposition},
    )
  except ClientError as e:
    raise HTTPException(status_code=500, detail=f"Could not retrieve file: {e.response['Error']['Message']}")


@inquiry_router.get("/{inquiry_id}", response_model=Inquiry, status_code=status.HTTP_200_OK)
async def inquiry_get(
  inquiry_id: str,
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.BOARD, UserRole.CONTROL, UserRole.ACCOUNTANT, UserRole.ADMIN])
  ),
):
  try:
    inquiry = get_inquiry(inquiry_id, repo)
  except InquiryNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
  _check_visibility(inquiry, user.id, user.role)
  from inquiries.operations import _enrich_inquiry

  _enrich_inquiry(inquiry, user_repo)
  return inquiry


@inquiry_router.put("/{inquiry_id}", response_model=Inquiry, status_code=status.HTTP_200_OK)
async def inquiry_update(
  inquiry_id: str,
  description: str | None = Form(None),
  title: str | None = Form(None),
  inquiry_type: str | None = Form(None),
  scope: str | None = Form(None),
  co_authors: str | None = Form(None),
  files: list[UploadFile] = File(default=[]),
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.BOARD, UserRole.CONTROL, UserRole.ACCOUNTANT, UserRole.ADMIN])
  ),
):
  try:
    inquiry = get_inquiry(inquiry_id, repo)
  except InquiryNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))

  if inquiry.author_id != user.id and user.role != UserRole.ADMIN:
    raise HTTPException(status_code=403, detail="Only the author can update this inquiry")

  scope_list = None
  if scope is not None:
    try:
      scope_list = json.loads(scope)
    except Exception:
      raise HTTPException(status_code=400, detail="Invalid scope format")

  co_authors_list = None
  if co_authors is not None:
    try:
      co_authors_list = json.loads(co_authors)
    except Exception:
      raise HTTPException(status_code=400, detail="Invalid co_authors format")

  data = InquiryUpdate(
    title=title,
    description=description,
    inquiry_type=inquiry_type,
    scope=scope_list,
    co_authors=co_authors_list,
  )

  try:
    return update_inquiry(inquiry, data, files, repo, user_repo)
  except InquiryStatusError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except RuntimeError as e:
    raise HTTPException(status_code=500, detail=str(e))


@inquiry_router.post("/{inquiry_id}/files", response_model=Inquiry, status_code=status.HTTP_200_OK)
async def inquiry_add_files(
  inquiry_id: str,
  files: list[UploadFile] = File(...),
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.BOARD, UserRole.CONTROL, UserRole.ACCOUNTANT, UserRole.ADMIN])
  ),
):
  try:
    inquiry = get_inquiry(inquiry_id, repo)
  except InquiryNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))

  from inquiries.models import InquiryStatus

  is_author = inquiry.author_id == user.id
  is_co_author = user.id in (inquiry.co_authors or [])
  is_scope_user = user.role in (inquiry.scope or [])
  if not (is_author or is_co_author or is_scope_user or user.role == UserRole.ADMIN):
    raise HTTPException(status_code=403, detail="You do not have permission to add files to this inquiry")

  allowed_statuses = {InquiryStatus.SENT, InquiryStatus.IN_PROGRESS}
  if inquiry.status not in allowed_statuses:
    raise HTTPException(status_code=400, detail="Files can only be added while the inquiry is sent or in progress")

  try:
    return add_inquiry_files(inquiry, files, repo)
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except RuntimeError as e:
    raise HTTPException(status_code=500, detail=str(e))


@inquiry_router.post("/{inquiry_id}/entry-number", response_model=Inquiry, status_code=status.HTTP_200_OK)
async def inquiry_assign_entry_number(
  inquiry_id: str,
  data: AssignEntryNumber,
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    inquiry = get_inquiry(inquiry_id, repo)
    return assign_entry_number(inquiry, data, repo, user_repo)
  except InquiryNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
  except InquiryStatusError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except RuntimeError as e:
    raise HTTPException(status_code=500, detail=str(e))


@inquiry_router.get("/{inquiry_id}/pdf", status_code=status.HTTP_200_OK)
async def inquiry_export_pdf(
  inquiry_id: str,
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.BOARD, UserRole.CONTROL, UserRole.ACCOUNTANT, UserRole.ADMIN])
  ),
):
  try:
    inquiry = get_inquiry(inquiry_id, repo)
  except InquiryNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))

  _check_visibility(inquiry, user.id, user.role)

  from inquiries.models import InquiryStatus

  if inquiry.status in {InquiryStatus.SENT}:
    raise HTTPException(status_code=400, detail="PDF export is only available after the entry number is assigned")

  from inquiries.operations import _enrich_inquiry

  _enrich_inquiry(inquiry, user_repo)

  try:
    pdf_bytes = export_pdf(inquiry)
    ascii_id = inquiry.entry_number or inquiry.id
    filename_ascii = f"inquiry_{ascii_id}.pdf"
    from urllib.parse import quote

    safe_title = inquiry.title[:50]
    filename_utf8 = quote(f"zapitване_{ascii_id}_{safe_title}.pdf")
    return Response(
      content=pdf_bytes,
      media_type="application/pdf",
      headers={"Content-Disposition": f"attachment; filename=\"{filename_ascii}\"; filename*=UTF-8''{filename_utf8}"},
    )
  except Exception as e:
    import traceback

    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


@inquiry_router.post("/{inquiry_id}/close", response_model=Inquiry, status_code=status.HTTP_200_OK)
async def inquiry_close(
  inquiry_id: str,
  final_status: str = Form(...),
  reason: str = Form(...),
  pdf_file: UploadFile | None = File(None),
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user_repo: UserRepository = Depends(get_user_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.BOARD, UserRole.CONTROL, UserRole.ACCOUNTANT, UserRole.ADMIN])
  ),
):
  try:
    inquiry = get_inquiry(inquiry_id, repo)
  except InquiryNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))

  data = CloseInquiry(final_status=final_status, reason=reason)
  try:
    return close_inquiry(inquiry, data, pdf_file, user.id, user.role, repo, user_repo)
  except InquiryAccessDeniedError as e:
    raise HTTPException(status_code=403, detail=str(e))
  except InquiryStatusError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except RuntimeError as e:
    raise HTTPException(status_code=500, detail=str(e))


@inquiry_router.delete("/{inquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def inquiry_delete(
  inquiry_id: str,
  repo: InquiryRepository = Depends(get_inquiry_repository),
  user=Depends(
    role_required([UserRole.REGULAR_USER, UserRole.BOARD, UserRole.CONTROL, UserRole.ACCOUNTANT, UserRole.ADMIN])
  ),
):
  try:
    inquiry = get_inquiry(inquiry_id, repo)
    delete_inquiry(inquiry, user.id, user.role, repo)
  except InquiryNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
  except InquiryAccessDeniedError as e:
    raise HTTPException(status_code=403, detail=str(e))
  except RuntimeError as e:
    raise HTTPException(status_code=500, detail=str(e))
