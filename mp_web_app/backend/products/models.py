from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ProductSize(BaseModel):
  model_config = ConfigDict(extra="ignore")

  label: str
  value: str | None = None
  width: Decimal | None = None
  height: Decimal | None = None
  length: Decimal | None = None


class Product(BaseModel):
  model_config = ConfigDict(
    from_attributes=True,
    extra="ignore",
  )

  id: str | None = None
  name: str
  description: str | None = None
  # Legacy flat dimensions kept for backward compatibility
  width: Decimal | None = None
  height: Decimal | None = None
  length: Decimal | None = None
  sizes: list[ProductSize] = []
  picture_s3_key: str | None = None
  picture_url: str | None = None


class ProductUpdate(BaseModel):
  name: str | None = None
  description: str | None = None
  # Legacy flat dimensions
  width: Decimal | None = None
  height: Decimal | None = None
  length: Decimal | None = None
  sizes: list[ProductSize] | None = None
  remove_picture: bool = False
