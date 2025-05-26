from datetime import datetime, timedelta
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import lru_cache

import boto3
from botocore.exceptions import ClientError
from fastapi import BackgroundTasks
from typing import Optional, Dict

from jose import jwt

from mp_web_site.app_config import SesSettings
from mp_web_site.backend.auth.operations import get_jwt_settings


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
  headers: Optional[Dict[str, str]] = None,
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
    text_body = re.sub('<[^<]+?>', '', html_body)

  # Build the MIME message
  msg = MIMEMultipart('alternative')
  msg['Subject'] = Header(subject, 'utf-8')
  msg['From'] = settings.sender
  msg['To'] = to_address
  if reply_to:
    msg['Reply-To'] = reply_to

  # Add custom headers
  if headers:
    for k, v in headers.items():
      msg[k] = v

  # Attach plain text and HTML parts
  part1 = MIMEText(text_body, 'plain', 'utf-8')
  part2 = MIMEText(html_body, 'html', 'utf-8')
  msg.attach(part1)
  msg.attach(part2)

  try:
    response = ses_client.send_raw_email(
      Source=settings.sender,
      Destinations=[to_address],
      RawMessage={'Data': msg.as_string()}
    )
    return response
  except ClientError as e:
    print(f"Error sending email: {e.response['Error']['Message']}")
    raise

def generate_unsubscribe_token(email: str) -> str:
  settings = get_jwt_settings()
  payload = {
    "email": email,
    "exp": datetime.now() + timedelta(days=30)
  }
  return jwt.encode(payload, settings.secret_key, algorithm="HS256")