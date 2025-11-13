from pydantic import BaseModel


class Product(BaseModel):
  id: str | None
  name: str
  width: float | None = None
  height: float | None = None
  length: float | None = None
  description: str | None = None


class ProductUpdate(BaseModel):
  name: str | None
  width: float | None
  height: float | None
  length: float | None
  description: str | None
