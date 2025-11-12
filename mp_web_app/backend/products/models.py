from pydantic import BaseModel


class ProductModel(BaseModel):
  name: str
  width: float
  height: float
  length: float
  description: str | None = None
