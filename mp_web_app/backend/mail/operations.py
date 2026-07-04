from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import lru_cache
from pathlib import Path
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from fastapi import Request
from pydantic import EmailStr

from app_config import FRONTEND_BASE_URL, SesSettings
from auth.operations import generate_activation_token, generate_reset_token, generate_unsubscribe_token
from mail.exceptions import EmailSendError

_TEMPLATES_DIR = Path(__file__).parent / "templates"


def render_template(template_name: str, **kwargs) -> str:
  """Load an HTML template from mail/templates/ and substitute variables."""
  template_path = _TEMPLATES_DIR / template_name
  if not template_path.exists():
    raise FileNotFoundError(f"Email template not found: {template_name}")
  content = template_path.read_text(encoding="utf-8")
  return content.format_map(kwargs)


@lru_cache
def get_mail_settings():
  """
  Returns a cached instance of SesSettings containing SES configuration loaded from environment variables.
  """
  return SesSettings()


def send_email_ses(
  to_address: str,
  subject: str,
  html_body: str,
  headers: Optional[dict[str, str]] = None,
  text_body: Optional[str] = None,
  reply_to: Optional[str] = None,
):
  """
  Send an email using AWS SES, supporting custom headers (e.g., List-Unsubscribe).
  """
  settings = get_mail_settings()
  ses_client = boto3.client("ses", region_name=settings.region)

  if text_body is None:
    # Fallback to plain text if not provided
    import re

    text_body = re.sub("<[^<]+?>", "", html_body)

  # Build the MIME message
  msg = MIMEMultipart("alternative")
  msg["Subject"] = Header(subject, "utf-8")
  msg["From"] = settings.sender
  msg["To"] = to_address
  if reply_to:
    msg["Reply-To"] = reply_to

  # Add custom headers
  if headers:
    for k, v in headers.items():
      msg[k] = v

  # Attach plain text and HTML parts
  part1 = MIMEText(text_body, "plain", "utf-8")
  part2 = MIMEText(html_body, "html", "utf-8")
  msg.attach(part1)
  msg.attach(part2)

  try:
    response = ses_client.send_raw_email(
      Source=settings.sender, Destinations=[to_address], RawMessage={"Data": msg.as_string()}
    )
    return response
  except ClientError as e:
    print(f"Error sending email: {e.response['Error']['Message']}")
    raise


def send_verification_email(
  email: EmailStr | str,
  verification_link: str,
):
  subject = "Потвърдете регистрацията си в ГПК Мурджов Пожар"
  html_body = render_template("verification.html", verification_link=verification_link)
  try:
    send_email_ses(to_address=email, subject=subject, html_body=html_body)
  except Exception as e:
    raise EmailSendError(f"Failed to send email: {e}")


def send_news_notification(
  request: Request,
  user_id: str,
  email: EmailStr,
  news_link: str,
):
  unsubscribe_link = construct_unsubscribe_link(user_id, email, request)
  subject = "ГПК Мурджов Пожар – нова новина"
  html_body = render_template("news_notification.html", news_link=news_link, unsubscribe_link=unsubscribe_link)
  try:
    send_email_ses(
      to_address=email,
      subject=subject,
      html_body=html_body,
      headers={"List-Unsubscribe": f"<{unsubscribe_link}>"},
    )
  except Exception:
    raise EmailSendError("Failed to send email")


def send_reset_email(
  email: EmailStr | str,
  verification_link: str,
):
  subject = "Рестартирайте паролата си в ГПК Мурджов Пожар"
  html_body = render_template("reset_password.html", verification_link=verification_link)
  try:
    send_email_ses(to_address=email, subject=subject, html_body=html_body)
  except Exception as e:
    raise EmailSendError(f"Failed to send email: {e}")


def send_file_share_notification(
  email: str,
  file_name: str,
  download_link: str,
) -> None:
  """Send a personal email notifying a user that a file was shared specifically with them."""
  subject = "ГПК Мурджов Пожар – споделен файл"
  html_body = render_template("share_notification.html", file_name=file_name, download_link=download_link)
  try:
    send_email_ses(to_address=email, subject=subject, html_body=html_body)
  except Exception as e:
    raise EmailSendError(f"Failed to send file share notification: {e}")


def send_upload_notification(
  email: str,
  file_name: str,
  category_bg: str,
  documents_link: str,
) -> None:
  """Send a broadcast email notifying a subscribed user that a new file was uploaded."""
  subject = f"ГПК Мурджов Пожар – нов файл в {category_bg}"
  html_body = render_template(
    "upload_notification.html",
    file_name=file_name,
    category_bg=category_bg,
    documents_link=documents_link,
  )
  try:
    send_email_ses(to_address=email, subject=subject, html_body=html_body)
  except Exception as e:
    raise EmailSendError(f"Failed to send upload notification: {e}")


def construct_verification_link(user_id: str, email: EmailStr | str, request: Request) -> str:
  token = generate_activation_token(user_id, email)
  base_url = str(request.base_url).rstrip("/")
  return f"{base_url}/api/users/activate-account?email={email}&token={token}"


def construct_unsubscribe_link(user_id: str, email: EmailStr | str, request: Request) -> str:
  token = generate_unsubscribe_token(user_id, email)
  return f"{FRONTEND_BASE_URL}/unsubscribe?email={email}&token={token}"


def construct_reset_link(user_id: str, email: EmailStr | str):
  token = generate_reset_token(user_id, email)
  return f"{FRONTEND_BASE_URL}/new-password?token={token}"
