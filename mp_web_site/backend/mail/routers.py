from fastapi import APIRouter, HTTPException

from mp_web_site.backend.mail.operations import send_email_ses

mail_router = APIRouter(tags=["email"])


@mail_router.post("/send-verification-email/")
def send_verification_email(
  email: str,
  verification_link: str,
):
  subject = "Verify your MySite account"
  html_body = f"""
        <html>
        <body>
            <p>Hello,</p>
            <p>Please verify your account by clicking the link below:</p>
            <a href="{verification_link}">{verification_link}</a>
            <p>If you did not request this, please ignore this email.</p>
        </body>
        </html>
    """
  try:
    send_email_ses(email, subject, html_body)
  except Exception as e:
    raise HTTPException(status_code=500, detail="Failed to send email")
  return {"message": "Verification email sent."}


@mail_router.post("/send-news-notification/")
def send_news_notification(
  email: str,
  news_html: str,
):
  subject = "What's New on MySite"
  html_body = news_html
  try:
    send_email_ses(email, subject, html_body)
  except Exception as e:
    raise HTTPException(status_code=500, detail="Failed to send email")
  return {"message": "News notification sent."}
