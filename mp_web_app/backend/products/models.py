from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class Product(BaseModel):
  model_config = ConfigDict(
    from_attributes=True,
    extra="ignore",
  )

  id: str | None = None
  name: str
  description: str | None = None
  width: Decimal | None = None
  height: Decimal | None = None
  length: Decimal | None = None
  picture_s3_key: str | None = None
  picture_url: str | None = None


class ProductUpdate(BaseModel):
  name: str | None = None
  description: str | None = None
  width: Decimal | None = None
  height: Decimal | None = None
  length: Decimal | None = None
  remove_picture: bool = False
