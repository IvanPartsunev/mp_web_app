class DatabaseError(Exception):
  """Raised when a database operation fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)


class NewsNotFoundError(Exception):
  """Raised when a news item is not found."""

  def __init__(self, news_id: str):
    self.news_id = news_id
    super().__init__(f"News with id {news_id} not found")
