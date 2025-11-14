class InvalidCredentialsError(Exception):
  """Raised when authentication credentials are invalid."""

  def __init__(self, message: str = "Invalid credentials"):
    self.message = message
    super().__init__(self.message)


class InvalidTokenError(Exception):
  """Raised when a token is invalid or expired."""

  def __init__(self, message: str = "Invalid or expired token"):
    self.message = message
    super().__init__(self.message)


class RefreshTokenNotFoundError(Exception):
  """Raised when a refresh token is not found in the database."""

  def __init__(self, message: str = "Refresh token not found"):
    self.message = message
    super().__init__(self.message)


class TokenExpiredError(Exception):
  """Raised when a token has expired."""

  def __init__(self, message: str = "Token expired"):
    self.message = message
    super().__init__(self.message)


class UnauthorizedError(Exception):
  """Raised when user is not authorized to perform an action."""

  def __init__(self, message: str = "Unauthorized"):
    self.message = message
    super().__init__(self.message)


class ForbiddenError(Exception):
  """Raised when user doesn't have permission to access a resource."""

  def __init__(self, message: str = "You do not have access to this resource"):
    self.message = message
    super().__init__(self.message)


class MissingRefreshTokenError(Exception):
  """Raised when refresh token is missing."""

  def __init__(self, message: str = "Missing refresh token"):
    self.message = message
    super().__init__(self.message)
