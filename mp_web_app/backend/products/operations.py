import os

from database.repositories import ProductRepository

PRODUCTS_TABLE_NAME = os.getenv("PRODUCTS_TABLE_NAME")

def get_product_repository() -> ProductRepository:
  """Dependency to get the member repository."""
  return ProductRepository(PRODUCTS_TABLE_NAME)
