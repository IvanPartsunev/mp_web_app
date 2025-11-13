from fastapi import APIRouter, Depends, HTTPException, status

from auth.operations import role_required
from database.exceptions import DatabaseError
from database.repositories import ProductRepository
from products.exceptions import ProductNotFoundError
from products.models import Product, ProductUpdate
from products.operations import (
  create_product,
  delete_product,
  get_product,
  get_product_repository,
  list_products,
  update_product,
)
from users.roles import UserRole

product_router = APIRouter(tags=["product"])


@product_router.get("/list", response_model=list[Product], status_code=status.HTTP_200_OK)
async def products_list(product_repo: ProductRepository = Depends(get_product_repository)):
  try:
    return list_products(product_repo)
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))


@product_router.post("/create", status_code=status.HTTP_201_CREATED)
async def product_create(
  product: Product,
  product_repo: ProductRepository = Depends(get_product_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    return create_product(product, product_repo)
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))


@product_router.put("/update/{product_id}", status_code=status.HTTP_200_OK)
async def product_update(
  product_id: str,
  product_data: ProductUpdate,
  product_repo: ProductRepository = Depends(get_product_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    existing_product = get_product(product_repo, product_id)
    update_product(product_data, existing_product, product_repo)
  except ProductNotFoundError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))


@product_router.delete("/delete/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def product_delete(
  product_id: str,
  product_repo: ProductRepository = Depends(get_product_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    existing_product = get_product(product_repo, product_id)
    delete_product(existing_product, product_repo)
  except ProductNotFoundError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))
