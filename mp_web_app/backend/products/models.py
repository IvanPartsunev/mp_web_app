from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class Product(BaseModel):
  model_config = ConfigDict(
    json_encoders={Decimal: float},
    from_attributes=True,
  )

  id: str | None = None
  name: str
  width: Decimal | None = None
  height: Decimal | None = None
  length: Decimal | None = None
  description: str | None = None


class ProductUpdate(BaseModel):
  model_config = ConfigDict(
    json_encoders={Decimal: float},
    from_attributes=True,
  )

  name: str | None = None
  width: Decimal | None = None
  height: Decimal | None = None
  length: Decimal | None = None
  description: str | None = None
