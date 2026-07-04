import json
from decimal import Decimal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from auth.operations import role_required
from database.exceptions import DatabaseError
from database.repositories import ProductRepository
from products.exceptions import ProductNotFoundError
from products.models import Product, ProductSize, ProductUpdate
from products.operations import (
  create_product,
  delete_orphaned_pictures,
  delete_product,
  get_product,
  get_product_repository,
  list_orphaned_pictures,
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


def _parse_sizes(sizes_json: str | None) -> list[ProductSize]:
  if not sizes_json:
    return []
  try:
    raw = json.loads(sizes_json)
    return [ProductSize(**s) for s in raw]
  except Exception:
    raise ValueError("Invalid sizes format — expected a JSON array of size objects")


@product_router.post("/create", response_model=Product, status_code=status.HTTP_201_CREATED)
async def product_create(
  name: str = Form(...),
  description: str | None = Form(None),
  width: Decimal | None = Form(None),
  height: Decimal | None = Form(None),
  length: Decimal | None = Form(None),
  sizes: str | None = Form(None),
  picture: UploadFile | None = File(None),
  product_repo: ProductRepository = Depends(get_product_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    return create_product(name, description, width, height, length, _parse_sizes(sizes), picture, product_repo)
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))


@product_router.put("/update/{product_id}", response_model=Product, status_code=status.HTTP_200_OK)
async def product_update(
  product_id: str,
  name: str | None = Form(None),
  description: str | None = Form(None),
  width: Decimal | None = Form(None),
  height: Decimal | None = Form(None),
  length: Decimal | None = Form(None),
  sizes: str | None = Form(None),
  remove_picture: bool = Form(False),
  picture: UploadFile | None = File(None),
  product_repo: ProductRepository = Depends(get_product_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    existing_product = get_product(product_repo, product_id)
  except ProductNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))

  try:
    parsed_sizes = _parse_sizes(sizes) if sizes is not None else None
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))

  product_data = ProductUpdate(
    name=name,
    description=description,
    width=width,
    height=height,
    length=length,
    sizes=parsed_sizes,
    remove_picture=remove_picture,
  )

  try:
    return update_product(product_data, existing_product, picture, product_repo)
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except DatabaseError as e:
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
    raise HTTPException(status_code=404, detail=str(e))
  except DatabaseError as e:
    raise HTTPException(status_code=500, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=400, detail=str(e))


@product_router.get("/orphans", status_code=status.HTTP_200_OK)
async def products_orphans_list(
  product_repo: ProductRepository = Depends(get_product_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    keys = list_orphaned_pictures(product_repo)
    return {"orphans": keys, "count": len(keys)}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@product_router.delete("/orphans", status_code=status.HTTP_200_OK)
async def products_orphans_delete(
  product_repo: ProductRepository = Depends(get_product_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    keys = list_orphaned_pictures(product_repo)
    deleted = delete_orphaned_pictures(keys)
    return {"deleted": deleted}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
