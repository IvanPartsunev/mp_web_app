class UserAlreadyExists(Exception):
  ...


class UserDoesNotExistException(Exception):
  ...


class FailedToSendEmailException(Exception):
  def __init__(self, status_code: int, text: str):
    self.status_code = status_code
    self.text = text
    super().__init__(f"Failed to send email: {status_code} - {text}")
