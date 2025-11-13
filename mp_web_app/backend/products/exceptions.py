class ProductNotFoundError(Exception):
  """Raised when a news item is not found."""

  def __init__(self, product_id: str):
    self.product_id = product_id
    super().__init__(f"Product with id {product_id} not found")
