from functools import lru_cache

import boto3
from botocore.exceptions import ClientError
from fastapi import BackgroundTasks
from typing import Optional

from mp_web_site.app_config import SesSettings


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
  text_body: Optional[str] = None,
  reply_to: Optional[str] = None,
):
  """
  Send an email using AWS SES.
  """
  settings = get_mail_settings()
  ses_client = boto3.client("ses", region_name=settings.region)

  if text_body is None:
    # Fallback to plain text if not provided
    import re
    text_body = re.sub('<[^<]+?>', '', html_body)

  try:
    response = ses_client.send_email(
      Source=settings.sender,
      Destination={"ToAddresses": [to_address]},
      Message={
        "Subject": {"Data": subject, "Charset": "UTF-8"},
        "Body": {
          "Html": {"Data": html_body, "Charset": "UTF-8"},
          "Text": {"Data": text_body, "Charset": "UTF-8"},
        },
      },
      ReplyToAddresses=[reply_to] if reply_to else [],
    )
    return response
  except ClientError as e:
    # Log or handle error as needed
    print(f"Error sending email: {e.response['Error']['Message']}")
    raise
