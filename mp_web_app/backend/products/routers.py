from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from auth.operations import role_required
from database.repositories import ProductRepository
from products.models import ProductModel
from products.operations import get_product_repository
from users.roles import UserRole

product_router = APIRouter(tags=['product'])


@product_router.get("/list", response_model=list[ProductModel], status_code=status.HTTP_200_OK)
async def product_list():
  ...


@product_router.post("/create", status_code=status.HTTP_201_CREATED)
async def product_create(
  product: ProductModel,
  product_repo: ProductRepository = Depends(get_product_repository),
  user = Depends(role_required([UserRole.ADMIN]))
):
  ...


@product_router.put("/update/{product_id}", status_code=status.HTTP_200_OK)
async def product_update(
  product_id: str,
  product: ProductModel,
  product_repo: ProductRepository = Depends(get_product_repository),
  user=Depends(role_required([UserRole.ADMIN]))
):
  ...


@product_router.delete("/delete/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def product_delete(
  product_id: str,
  product_repo: ProductRepository = Depends(get_product_repository),
  user=Depends(role_required([UserRole.ADMIN]))
):
  ...
