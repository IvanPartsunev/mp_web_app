from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from auth.operations import role_required
from database.repositories import GalleryRepository
from gallery.exceptions import DatabaseError, ImageNotFoundError, ImageUploadError, InvalidImageFormatError, PresignedUrlError
from gallery.models import GalleryImageMetadata
from gallery.operations import (
  delete_gallery_image,
  generate_presigned_url,
  get_gallery_images,
  get_gallery_repository,
  upload_gallery_image,
)
from users.roles import UserRole

gallery_router = APIRouter(tags=["gallery"])


@gallery_router.post("/upload", response_model=GalleryImageMetadata, status_code=status.HTTP_201_CREATED)
async def gallery_upload(
  file: UploadFile = File(...),
  image_name: str = Form(None),
  gallery_repo: GalleryRepository = Depends(get_gallery_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Upload a new gallery image (ADMIN only)."""
  try:
    return upload_gallery_image(file=file, image_name=image_name, user_id=user.id, repo=gallery_repo)
  except InvalidImageFormatError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
  except ImageUploadError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
  except DatabaseError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exception raised during gallery upload: {e}")


@gallery_router.get("/list", status_code=status.HTTP_200_OK)
async def gallery_list(gallery_repo: GalleryRepository = Depends(get_gallery_repository)):
  """List all gallery images (public access)."""
  try:
    return get_gallery_images(repo=gallery_repo)
  except DatabaseError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch gallery images: {e}"
    )


@gallery_router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
async def gallery_delete(
  image_id: str,
  gallery_repo: GalleryRepository = Depends(get_gallery_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  """Delete a gallery image (ADMIN only)."""
  try:
    delete_gallery_image(image_id=image_id, repo=gallery_repo)
  except ImageNotFoundError as e:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
  except ImageUploadError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
  except DatabaseError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exception raised during gallery deletion: {e}"
    )


@gallery_router.get("/image/{image_id}", status_code=status.HTTP_200_OK)
async def gallery_image_url(image_id: str, gallery_repo: GalleryRepository = Depends(get_gallery_repository)):
  """Get presigned URL for a gallery image."""
  try:
    response = gallery_repo.table.get_item(Key={"id": image_id})
    if "Item" not in response:
      raise ImageNotFoundError("Image not found")

    item = response["Item"]
    url = generate_presigned_url(s3_key=item["s3_key"], bucket=item["s3_bucket"])
    return {"url": url}
  except ImageNotFoundError as e:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
  except PresignedUrlError as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exception raised: {e}")
