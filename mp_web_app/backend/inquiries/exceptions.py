class InquiryNotFoundError(Exception):
  def __init__(self, inquiry_id: str):
    super().__init__(f"Inquiry with id {inquiry_id} not found")


class InquiryAccessDeniedError(Exception):
  def __init__(self):
    super().__init__("You do not have permission to perform this action on this inquiry")


class InquiryStatusError(Exception):
  def __init__(self, message: str):
    super().__init__(message)
