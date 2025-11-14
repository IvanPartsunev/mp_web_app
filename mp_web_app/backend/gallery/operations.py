import os
from datetime import datetime
from uuid import uuid4

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from fastapi import UploadFile

from database.exceptions import DatabaseError
from database.repositories import GalleryRepository
from gallery.exceptions import (
  ImageNotFoundError,
  ImageUploadError,
  InvalidImageFormatError,
  PresignedUrlError,
)
from gallery.models import GalleryImageMetadata

GALLERY_BUCKET = os.environ.get("UPLOADS_BUCKET")
GALLERY_TABLE_NAME = os.environ.get("GALLERY_TABLE_NAME")
CLOUDFRONT_DOMAIN = os.environ.get("CLOUDFRONT_DOMAIN")  # e.g., d123.cloudfront.net
USE_CLOUDFRONT = os.environ.get("USE_CLOUDFRONT", "false").lower() == "true"

ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"]


def get_gallery_repository() -> GalleryRepository:
  """Dependency to get the gallery repository."""
  return GalleryRepository(GALLERY_TABLE_NAME)


def upload_gallery_image(
  file: UploadFile, image_name: str, user_id: str, repo: GalleryRepository
) -> GalleryImageMetadata:
  """Upload gallery image to S3 and store metadata in DynamoDB."""
  # Validate file extension
  file_extension = file.filename.split(".")[-1].lower()
  if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
    raise InvalidImageFormatError(ALLOWED_IMAGE_EXTENSIONS)

  # Generate unique S3 key
  image_id = str(uuid4())
  timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
  s3_key = f"gallery/{timestamp}_{image_id}.{file_extension}"

  # Upload to S3
  s3 = boto3.client("s3")
  try:
    s3.upload_fileobj(file.file, GALLERY_BUCKET, s3_key)
  except ClientError as e:
    raise ImageUploadError(f"Failed to upload image: {e.response['Error']['Message']}")

  # Store metadata in DynamoDB
  created_at = datetime.now().isoformat()
  gallery_item = {
    "id": image_id,
    "gallery": "gallery",
    "image_name": image_name or file.filename,
    "s3_key": s3_key,
    "s3_bucket": GALLERY_BUCKET,
    "uploaded_by": user_id,
    "created_at": created_at,
  }

  try:
    repo.table.put_item(Item=gallery_item)
  except ClientError as e:
    # Rollback S3 upload
    try:
      s3.delete_object(Bucket=GALLERY_BUCKET, Key=s3_key)
    except:
      pass
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")

  return repo.convert_item_to_object(gallery_item)


def get_gallery_images(repo: GalleryRepository, include_urls: bool = True):
  """
  Retrieve all gallery images from DynamoDB.
  
  Args:
    repo: Gallery repository
    include_urls: If True, adds 'url' field with CloudFront/S3 URL to each image
  
  Returns:
    List of gallery image objects with optional URLs
  """
  try:
    response = repo.table.query(
      IndexName="gallery_created_at_index", KeyConditionExpression=Key("gallery").eq("gallery"), ScanIndexForward=False
    )
    items = response["Items"]

    while "LastEvaluatedKey" in response:
      response = repo.table.query(
        IndexName="gallery_created_at_index",
        KeyConditionExpression=Key("gallery").eq("gallery"),
        ScanIndexForward=False,
        ExclusiveStartKey=response["LastEvaluatedKey"],
      )
      items.extend(response["Items"])

    images = [repo.convert_item_to_object(item) for item in items]
    
    # Add URLs to each image if requested
    if include_urls:
      for image in images:
        try:
          image.url = generate_presigned_url(s3_key=image.s3_key, bucket=image.s3_bucket)
        except Exception:
          # If URL generation fails, skip this image
          image.url = None
    
    return images
  except ClientError as e:
    raise DatabaseError(f"Failed to fetch gallery images: {e.response['Error']['Message']}")


def delete_gallery_image(image_id: str, repo: GalleryRepository) -> bool:
  """Delete gallery image from S3 and DynamoDB."""
  # Get image metadata
  try:
    response = repo.table.get_item(Key={"id": image_id})
    if "Item" not in response:
      raise ImageNotFoundError("Image not found")

    item = response["Item"]
    s3_key = item["s3_key"]
    s3_bucket = item["s3_bucket"]
  except ClientError as e:
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")

  # Delete from S3
  s3 = boto3.client("s3")
  try:
    s3.delete_object(Bucket=s3_bucket, Key=s3_key)
  except ClientError as e:
    raise ImageUploadError(f"Failed to delete image from S3: {e.response['Error']['Message']}")

  # Delete from DynamoDB
  try:
    repo.table.delete_item(Key={"id": image_id})
  except ClientError as e:
    raise DatabaseError(f"Failed to delete metadata: {e.response['Error']['Message']}")

  return True


def generate_presigned_url(s3_key: str, bucket: str, expiration: int = 3600) -> str:
  """
  Generate URL for image access.
  
  If CloudFront is enabled, returns CloudFront URL (permanent, cached).
  Otherwise, returns S3 presigned URL (temporary, direct to S3).
  """
  # Use CloudFront if configured (recommended for production)
  if USE_CLOUDFRONT and CLOUDFRONT_DOMAIN:
    return f"https://{CLOUDFRONT_DOMAIN}/{s3_key}"
  
  # Fallback to S3 presigned URL
  s3 = boto3.client("s3")
  try:
    url = s3.generate_presigned_url("get_object", Params={"Bucket": bucket, "Key": s3_key}, ExpiresIn=expiration)
    return url
  except ClientError as e:
    raise PresignedUrlError(f"Failed to generate presigned URL: {e.response['Error']['Message']}")
