class UserAlreadyExistsError(Exception):
  """Raised when attempting to create a user that already exists."""

  def __init__(self, email: str):
    self.email = email
    super().__init__(f"User with email {email} already exists")


class UserNotFoundError(Exception):
  """Raised when a user is not found."""

  def __init__(self, identifier: str):
    self.identifier = identifier
    super().__init__(f"User {identifier} not found")


class ValidationError(Exception):
  """Raised when validation fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)


class FailedToSendEmailException(Exception):
  def __init__(self, status_code: int, text: str):
    self.status_code = status_code
    self.text = text
    super().__init__(f"Failed to send email: {status_code} - {text}")


class DatabaseError(Exception):
  """Raised when a database operation fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)
