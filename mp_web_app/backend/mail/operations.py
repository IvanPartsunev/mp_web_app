from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import lru_cache
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from fastapi import Request
from pydantic import EmailStr

from app_config import FRONTEND_BASE_URL, SesSettings
from auth.operations import generate_activation_token, generate_reset_token, generate_unsubscribe_token
from mail.exceptions import EmailSendError


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
  subject = "Verify your MySite account"

  html_body = f"""
    <!DOCTYPE html>
    <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <title>Потвърдете Вашия акаунт</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f8f9fa;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;padding:32px 24px;margin:40px auto;">
                <tr>
                  <td style="font-family:Arial,sans-serif;color:#222;font-size:16px;text-align:left;padding:0;">
                    <p style="margin:0 0 16px 0;">Здравейте,</p>
                    <p style="margin:0 0 24px 0;">Моля, потвърдете Вашия акаунт, като натиснете бутона по-долу:</p>
                    <a href="{verification_link}"
                       style="display:inline-block;padding:12px 28px;background-color:#16a34a;color:#fff;text-decoration:none;border-radius:5px;font-size:16px;font-weight:bold;letter-spacing:1px;margin-bottom:24px;">
                      Кликнете тук
                    </a>
                    <p style="margin:24px 0 0 0;">Ако не сте заявили регистрация, моля игнорирайте този имейл.</p>
                    <p style="margin:24px 0 0 0;font-size:13px;">С уважение, от екипа на<br>ГПК "Мурджов пожар"<br>с. Славейно</p>
                    <p style="margin:32px 0 0 0;font-size:13px;color:#888;text-align:left;">
                      Това е автоматично съобщение, моля не отговаряйте на този имейл.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """
  try:
    send_email_ses(
      to_address=email,
      subject=subject,
      html_body=html_body,
    )
  except Exception as e:
    raise EmailSendError(f"Failed to send email: {e}")


def send_news_notification(
  request: Request,
  user_id: str,
  email: str,
  news_link: str,
):
  unsubscribe_link = construct_unsubscribe_link(user_id, email, request)

  subject = "Какво ново в MySite"

  html_body = f"""
    <!DOCTYPE html>
    <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <title>Нова новина в MySite</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f8f9fa;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;padding:32px 24px;margin:40px auto;">
                <tr>
                  <td style="font-family:Arial,sans-serif;color:#222;font-size:16px;text-align:left;padding:0;">
                    <p style="margin:0 0 16px 0;">Здравейте,</p>
                    <p style="margin:0 0 24px 0;">Има нова новина на нашия сайт! Можете да я прочетете, като натиснете бутона по-долу:</p>
                    <a href="{news_link}"
                       style="display:inline-block;padding:12px 28px;background-color:#16a34a;color:#fff;text-decoration:none;border-radius:5px;font-size:16px;font-weight:bold;letter-spacing:1px;margin-bottom:24px;">
                      Кликнете тук
                    </a>
                    <p style="margin:24px 0 0 0;">Ако не сте заявили абонамент за новини, моля игнорирайте този имейл.</p>
                    <p style="margin:32px 0 0 0;font-size:13px;color:#888;text-align:left;">
                      Това е автоматично съобщение, моля не отговаряйте на този имейл.<br>
                      Ако не желаете да получавате повече новини, <a href="{unsubscribe_link}" style="color:#16a34a;">отпишете се тук</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """
  try:
    send_email_ses(
      to_address=email, subject=subject, html_body=html_body, headers={"List-Unsubscribe": f"<{unsubscribe_link}>"}
    )
  except Exception:
    raise EmailSendError("Failed to send email")


def send_reset_email(
  email: EmailStr | str,
  verification_link: str,
):
  subject = "Reset account password"

  html_body = f"""
    <!DOCTYPE html>
    <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <title>Промяна на парола</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f8f9fa;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:8px;padding:32px 24px;margin:40px auto;">
                <tr>
                  <td style="font-family:Arial,sans-serif;color:#222;font-size:16px;text-align:left;padding:0;">
                    <p style="margin:0 0 16px 0;">Здравейте,</p>
                    <p style="margin:0 0 24px 0;">Моля, за да рестартирате вашата парола натиснете бутона по-долу:</p>
                    <a href="{verification_link}"
                       style="display:inline-block;padding:12px 28px;background-color:#16a34a;color:#fff;text-decoration:none;border-radius:5px;font-size:16px;font-weight:bold;letter-spacing:1px;margin-bottom:24px;">
                      Кликнете тук
                    </a>
                    <p style="margin:24px 0 0 0;">Ако не сте заявили рестартиране, моля игнорирайте този имейл.</p>
                    <p style="margin:24px 0 0 0;font-size:13px;">С уважение, от екипа на<br>ГПК "Мурджов пожар"<br>с. Славейно</p>
                    <p style="margin:32px 0 0 0;font-size:13px;color:#888;text-align:left;">
                      Това е автоматично съобщение, моля не отговаряйте на този имейл.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """
  try:
    send_email_ses(
      to_address=email,
      subject=subject,
      html_body=html_body,
    )
  except Exception as e:
    raise EmailSendError(f"Failed to send email: {e}")


def construct_verification_link(user_id: str, email: EmailStr | str, request: Request) -> str:
  token = generate_activation_token(user_id, email)
  # AWS API Gateway adds /prod stage to the URL
  base_url = str(request.base_url).rstrip("/") + "/prod"
  return f"{base_url}/api/users/activate-account?email={email}&token={token}"


def construct_unsubscribe_link(user_id: str, email: EmailStr | str, request: Request) -> str:
  token = generate_unsubscribe_token(user_id, email)
  # Redirect to frontend page instead of backend endpoint
  return f"{FRONTEND_BASE_URL}/unsubscribe?email={email}&token={token}"


def construct_reset_link(user_id: str, email: EmailStr | str):
  token = generate_reset_token(user_id, email)
  return f"{FRONTEND_BASE_URL}/new-password?token={token}"
