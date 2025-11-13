class InvalidImageFormatError(Exception):
  """Raised when an invalid image format is provided."""

  def __init__(self, allowed: list[str]):
    self.allowed = allowed
    super().__init__(f"Invalid image format. Allowed: {', '.join(allowed)}")


class ImageUploadError(Exception):
  """Raised when image upload fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)


class ImageNotFoundError(Exception):
  """Raised when an image is not found."""

  def __init__(self, message: str = "Image not found"):
    self.message = message
    super().__init__(self.message)


class PresignedUrlError(Exception):
  """Raised when presigned URL generation fails."""

  def __init__(self, message: str):
    self.message = message
    super().__init__(self.message)
