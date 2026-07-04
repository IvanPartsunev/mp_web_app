import os
from decimal import Decimal
from typing import Any
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

from database.exceptions import DatabaseError
from database.repositories import ProductRepository
from products.exceptions import ProductNotFoundError
from products.models import Product, ProductSize, ProductUpdate

PRODUCTS_TABLE_NAME = os.getenv("PRODUCTS_TABLE_NAME")
PRODUCTS_BUCKET = os.environ.get("UPLOADS_BUCKET")
CLOUDFRONT_DOMAIN = os.environ.get("CLOUDFRONT_DOMAIN")
USE_CLOUDFRONT = os.environ.get("USE_CLOUDFRONT", "false").lower() == "true"

ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"]
MAX_IMAGE_SIZE_MB = 15
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024


def get_product_repository() -> ProductRepository:
  return ProductRepository(PRODUCTS_TABLE_NAME)


# ---------------------------------------------------------------------------
# Picture helpers
# ---------------------------------------------------------------------------


def _generate_picture_url(s3_key: str) -> str:
  if USE_CLOUDFRONT and CLOUDFRONT_DOMAIN:
    return f"https://{CLOUDFRONT_DOMAIN}/{s3_key}"
  s3 = boto3.client("s3")
  return s3.generate_presigned_url(
    "get_object",
    Params={"Bucket": PRODUCTS_BUCKET, "Key": s3_key},
    ExpiresIn=3600,
  )


def upload_product_picture(file: UploadFile) -> str:
  if not file.filename or "." not in file.filename:
    raise ValueError(f"Invalid image format. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}")
  ext = file.filename.split(".")[-1].lower()
  if ext not in ALLOWED_IMAGE_EXTENSIONS:
    raise ValueError(f"Invalid image format. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}")
  file.file.seek(0, 2)
  file_size = file.file.tell()
  file.file.seek(0)
  if file_size > MAX_IMAGE_SIZE_BYTES:
    raise ValueError(f"File too large. Maximum: {MAX_IMAGE_SIZE_MB}MB")
  s3_key = f"products/{uuid4()}.{ext}"
  s3 = boto3.client("s3")
  try:
    s3.upload_fileobj(file.file, PRODUCTS_BUCKET, s3_key)
  except ClientError as e:
    raise RuntimeError(f"Failed to upload image: {e.response['Error']['Message']}")
  return s3_key


def delete_product_picture(s3_key: str) -> None:
  s3 = boto3.client("s3")
  try:
    s3.delete_object(Bucket=PRODUCTS_BUCKET, Key=s3_key)
  except ClientError:
    pass


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


def _attach_picture_url(product: Product) -> None:
  if product.picture_s3_key:
    try:
      product.picture_url = _generate_picture_url(product.picture_s3_key)
    except Exception:
      product.picture_url = None


def get_product(repo: ProductRepository, product_id: str) -> Product:
  response = repo.table.get_item(Key={"id": product_id})
  if "Item" not in response:
    raise ProductNotFoundError(product_id)
  product = repo.convert_item_to_object(response["Item"])
  _attach_picture_url(product)
  return product


def _serialize_sizes(sizes: list[ProductSize]) -> list[dict]:
  return [{k: v for k, v in s.model_dump().items() if v is not None or k == "label"} for s in sizes]


def create_product(
  name: str,
  description: str | None,
  width: Decimal | None,
  height: Decimal | None,
  length: Decimal | None,
  sizes: list[ProductSize],
  picture: UploadFile | None,
  repo: ProductRepository,
) -> Product:
  s3_key: str | None = None
  if picture and picture.filename:
    s3_key = upload_product_picture(picture)

  product_item: dict[str, Any] = {
    "id": str(uuid4()),
    "name": name,
    "description": description,
    "width": width,
    "height": height,
    "length": length,
    "sizes": _serialize_sizes(sizes),
    "picture_s3_key": s3_key,
  }

  try:
    repo.table.put_item(Item=product_item)
  except ClientError as e:
    if s3_key:
      delete_product_picture(s3_key)
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")

  product = repo.convert_item_to_object(product_item)
  _attach_picture_url(product)
  return product


def update_product(
  product_update: ProductUpdate,
  product: Product,
  picture: UploadFile | None,
  repo: ProductRepository,
) -> Product:
  update_parts = []
  attr_values: dict[str, Any] = {}
  attr_names: dict[str, str] = {}

  if picture and picture.filename:
    new_s3_key = upload_product_picture(picture)
    if product.picture_s3_key:
      delete_product_picture(product.picture_s3_key)
    update_parts.append("#picture_s3_key = :picture_s3_key")
    attr_values[":picture_s3_key"] = new_s3_key
    attr_names["#picture_s3_key"] = "picture_s3_key"
  elif product_update.remove_picture and product.picture_s3_key:
    delete_product_picture(product.picture_s3_key)
    update_parts.append("#picture_s3_key = :picture_s3_key")
    attr_values[":picture_s3_key"] = None
    attr_names["#picture_s3_key"] = "picture_s3_key"

  if product_update.name is not None:
    update_parts.append("#name = :name")
    attr_values[":name"] = product_update.name
    attr_names["#name"] = "name"

  if product_update.description is not None:
    update_parts.append("#description = :description")
    attr_values[":description"] = product_update.description
    attr_names["#description"] = "description"

  for field in ("width", "height", "length"):
    val = getattr(product_update, field)
    if val is not None:
      update_parts.append(f"#{field} = :{field}")
      attr_values[f":{field}"] = val
      attr_names[f"#{field}"] = field

  if product_update.sizes is not None:
    update_parts.append("#sizes = :sizes")
    attr_values[":sizes"] = _serialize_sizes(product_update.sizes)
    attr_names["#sizes"] = "sizes"

  if not update_parts:
    return product

  response = repo.table.update_item(
    Key={"id": product.id},
    UpdateExpression="SET " + ", ".join(update_parts),
    ExpressionAttributeValues=attr_values,
    ExpressionAttributeNames=attr_names,
    ReturnValues="ALL_NEW",
  )

  updated = repo.convert_item_to_object(response["Attributes"])
  _attach_picture_url(updated)
  return updated


def delete_product(product: Product, repo: ProductRepository) -> None:
  if product.picture_s3_key:
    delete_product_picture(product.picture_s3_key)
  repo.table.delete_item(Key={"id": product.id})


def list_products(repo: ProductRepository) -> list[Product]:
  try:
    items = _get_products_from_db(repo)
    products = [repo.convert_item_to_object(item) for item in items]
    for p in products:
      _attach_picture_url(p)
    return products
  except ClientError as e:
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")


def _get_products_from_db(repo: ProductRepository) -> list[dict[Any, Any]]:
  products = []
  scan_kwargs: dict[str, Any] = {}
  table = repo.table
  while True:
    response = table.scan(**scan_kwargs)
    products.extend(response.get("Items", []))
    if "LastEvaluatedKey" not in response:
      break
    scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
  return products


# ---------------------------------------------------------------------------
# Orphan cleanup
# ---------------------------------------------------------------------------


def list_orphaned_pictures(repo: ProductRepository) -> list[str]:
  items = _get_products_from_db(repo)
  referenced: set[str] = {item["picture_s3_key"] for item in items if item.get("picture_s3_key")}
  s3 = boto3.client("s3")
  all_keys: list[str] = []
  paginator = s3.get_paginator("list_objects_v2")
  for page in paginator.paginate(Bucket=PRODUCTS_BUCKET, Prefix="products/"):
    for obj in page.get("Contents", []):
      all_keys.append(obj["Key"])
  return [key for key in all_keys if key not in referenced]


def delete_orphaned_pictures(keys: list[str]) -> int:
  if not keys:
    return 0
  s3 = boto3.client("s3")
  s3.delete_objects(Bucket=PRODUCTS_BUCKET, Delete={"Objects": [{"Key": k} for k in keys]})
  return len(keys)
