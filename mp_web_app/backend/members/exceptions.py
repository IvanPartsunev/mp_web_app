class DatabaseError(Exception):
  """Raised when a database operation fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)


class InvalidFileTypeError(Exception):
  """Raised when an invalid file type is provided."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)


class MemberNotFoundError(Exception):
  """Raised when a member is not found."""

  def __init__(self, member_code: str):
    self.member_code = member_code
    super().__init__(f"Member with code {member_code} not found")


class ValidationError(Exception):
  """Raised when validation fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)
