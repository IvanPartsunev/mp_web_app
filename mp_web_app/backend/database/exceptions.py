class DatabaseError(Exception):
  """Raised when a database operation fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)
