class EmailSendError(Exception):
  """Raised when email sending fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)


class InvalidTokenError(Exception):
  """Raised when an invalid or expired token is provided."""

  def __init__(self, message: str = "Email mismatch or invalid token"):
    self.message = message
    super().__init__(self.message)
