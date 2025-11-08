from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File, Form

from auth.operations import role_required
from database.repositories import GalleryRepository
from gallery.models import GalleryImageMetadata
from gallery.operations import (
  get_gallery_repository,
  upload_gallery_image,
  get_gallery_images,
  delete_gallery_image,
  generate_presigned_url
)
from users.roles import UserRole

gallery_router = APIRouter(tags=["gallery"])


@gallery_router.post("/upload", response_model=GalleryImageMetadata, status_code=status.HTTP_201_CREATED)
async def gallery_upload(
  file: UploadFile = File(...),
  image_name: str = Form(None),
  gallery_repo: GalleryRepository = Depends(get_gallery_repository),
  user=Depends(role_required([UserRole.ADMIN]))
):
  """Upload a new gallery image (ADMIN only)."""
  try:
    return upload_gallery_image(file=file, image_name=image_name, user_id=user.id, repo=gallery_repo)
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Exception raised during gallery upload: {e}"
    )


@gallery_router.get("/list", status_code=status.HTTP_200_OK)
async def gallery_list(
  gallery_repo: GalleryRepository = Depends(get_gallery_repository)
):
  """List all gallery images (public access)."""
  try:
    return get_gallery_images(repo=gallery_repo)
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f"Failed to fetch gallery images: {e}"
    )


@gallery_router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
async def gallery_delete(
  image_id: str,
  gallery_repo: GalleryRepository = Depends(get_gallery_repository),
  user=Depends(role_required([UserRole.ADMIN]))
):
  """Delete a gallery image (ADMIN only)."""
  try:
    delete_gallery_image(image_id=image_id, repo=gallery_repo)
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Exception raised during gallery deletion: {e}"
    )


@gallery_router.get("/image/{image_id}", status_code=status.HTTP_200_OK)
async def gallery_image_url(
  image_id: str,
  gallery_repo: GalleryRepository = Depends(get_gallery_repository)
):
  """Get presigned URL for a gallery image."""
  try:
    response = gallery_repo.table.get_item(Key={"id": image_id})
    if "Item" not in response:
      raise HTTPException(status_code=404, detail="Image not found")
    
    item = response["Item"]
    url = generate_presigned_url(s3_key=item["s3_key"], bucket=item["s3_bucket"])
    return {"url": url}
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Exception raised: {e}"
    )
