import os
from typing import Any
from uuid import uuid4

from botocore.exceptions import ClientError

from database.exceptions import DatabaseError
from database.repositories import ProductRepository
from products.exceptions import ProductNotFoundError
from products.models import Product, ProductUpdate

PRODUCTS_TABLE_NAME = os.getenv("PRODUCTS_TABLE_NAME")


def get_product_repository() -> ProductRepository:
  """Dependency to get the member repository."""
  return ProductRepository(PRODUCTS_TABLE_NAME)


def get_product(repo: ProductRepository, product_id: str) -> Product:
  response = repo.table.get_item(Key={"id": product_id})
  if "Item" not in response:
    raise ProductNotFoundError
  return repo.convert_item_to_object(response["Item"])


def create_product(product: Product, repo: ProductRepository) -> None:
  product_item = {
    "product_id": str(uuid4()),
    "name": product.name,
    "width": product.width,
    "height": product.height,
    "length": product.length,
    "description": product.description,
  }

  try:
    repo.table.put_item(Item=product_item)
  except ClientError as e:
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")


def update_product(product_update: ProductUpdate, product: Product, repo: ProductRepository) -> Product:
  # Build update expression
  update_expression_parts = []
  expression_attribute_values = {}
  expression_attribute_names = {}

  if product_update.name is not None:
    update_expression_parts.append("#name = :name")
    expression_attribute_values[":name"] = product_update.name
    expression_attribute_names[":name"] = "name"

  if product_update.length is not None:
    update_expression_parts.append("#length = :length")
    expression_attribute_values[":length"] = product_update.length
    expression_attribute_names["#length"] = "length"

  if product_update.width is not None:
    update_expression_parts.append("#width = :width")
    expression_attribute_values[":width"] = product_update.width
    expression_attribute_names["#width"] = "width"

  if product_update.height is not None:
    update_expression_parts.append("#height = :height")
    expression_attribute_values[":height"] = product_update.height
    expression_attribute_names["#height"] = "height"

  if product_update.description is not None:
    update_expression_parts.append("#description = :description")
    expression_attribute_values[":description"] = product_update.description
    expression_attribute_names["#description"] = "description"

  # Build the update expression
  update_expression = "SET" + ", ".join(update_expression_parts)

  # Update item
  response = repo.table.update_item(
    Key={"id": product.id},
    UpdateExpression=update_expression,
    ExpressionAttributeValues=expression_attribute_values,
    ExpressionAttributeNames=expression_attribute_names,
    ReturnValues="ALL_NEW",
  )

  return repo.convert_item_to_object(response["Attributes"])


def delete_product(product: Product, repo: ProductRepository) -> None:
  repo.table.delete_item(Key={"id": product.id})


def list_products(repo: ProductRepository) -> list[Product]:
  try:
    products = _get_products_from_db(repo)
    product_objects = [repo.convert_item_to_object(product) for product in products]
    return product_objects
  except ClientError as e:
    raise DatabaseError(f"Database error: {e.response['Error']['Message']}")


def _get_products_from_db(repo: ProductRepository) -> list[dict[Any, Any]]:
  products = []
  scan_kwargs = {}
  table = repo.table

  while True:
    response = table.scan(**scan_kwargs)
    products.extend(response.get("items", []))

    if "LastEvaluatedKey" not in response:
      break
    scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]

  return products
