from pydantic import BaseModel


class GalleryImage(BaseModel):
  image_name: str


class GalleryImageMetadata(BaseModel):
  id: str
  image_name: str
  s3_key: str
  s3_bucket: str
  uploaded_by: str
  created_at: str
