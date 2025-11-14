class FileUploadError(Exception):
  """Raised when file upload fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)


class FileNotFoundError(Exception):
  """Raised when a file is not found."""

  def __init__(self, message: str = "File not found"):
    self.message = message
    super().__init__(self.message)


class MetadataError(Exception):
  """Raised when file metadata operations fail."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)


class InvalidFileExtensionError(Exception):
  """Raised when an invalid file extension is provided."""

  def __init__(self, extension: str, allowed: list[str]):
    self.extension = extension
    self.allowed = allowed
    super().__init__(f"File extension {extension.upper()} not allowed. Allowed: {', '.join(allowed)}")


class FileAccessDeniedError(Exception):
  """Raised when user doesn't have access to a file."""

  def __init__(self, file_name: str):
    self.file_name = file_name
    super().__init__(f"File {file_name} not allowed to user")


class InvalidMetadataError(Exception):
  """Raised when file metadata is invalid."""

  def __init__(self, file_name: str):
    self.file_name = file_name
    super().__init__(f"Metadata not valid for file: {file_name}")


class MissingAllowedUsersError(Exception):
  """Raised when private file doesn't specify allowed users."""

  def __init__(self):
    super().__init__("When [private] is selected allowed users must be specified")
