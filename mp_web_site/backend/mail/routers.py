from fastapi import APIRouter, HTTPException, Request
from starlette.responses import HTMLResponse

from mp_web_site.backend.mail.operations import send_email_ses, generate_unsubscribe_token

mail_router = APIRouter(tags=["email"])


@mail_router.post("/send-verification-email/")
def send_verification_email(
  email: str,
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
                       style="display:inline-block;padding:12px 28px;background-color:#1976d2;color:#fff;text-decoration:none;border-radius:5px;font-size:16px;font-weight:bold;letter-spacing:1px;margin-bottom:24px;">
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
    raise HTTPException(status_code=500, detail="Failed to send email")
  return {"message": "Verification email sent."}


@mail_router.post("/send-news-notification")
async def send_news_notification(
  request: Request,
  email: str,
  news_link: str,
):
  subject = "Какво ново в MySite"
  token = generate_unsubscribe_token(email)
  base_url = str(request.base_url).rstrip("/")
  unsubscribe_link = f"{base_url}/api/mail/unsubscribe?email={email}&token={token}"

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
                       style="display:inline-block;padding:12px 28px;background-color:#1976d2;color:#fff;text-decoration:none;border-radius:5px;font-size:16px;font-weight:bold;letter-spacing:1px;margin-bottom:24px;">
                      Кликнете тук
                    </a>
                    <p style="margin:24px 0 0 0;">Ако не сте заявили абонамент за новини, моля игнорирайте този имейл.</p>
                    <p style="margin:32px 0 0 0;font-size:13px;color:#888;text-align:left;">
                      Това е автоматично съобщение, моля не отговаряйте на този имейл.<br>
                      Ако не желаете да получавате повече новини, <a href="{unsubscribe_link}" style="color:#1976d2;">отпишете се тук {unsubscribe_link}</a>.
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
      headers={
        "List-Unsubscribe": f"<{unsubscribe_link}>"
      }
    )
  except Exception as e:
    raise HTTPException(status_code=500, detail="Failed to send email")
  return {"message": "News notification sent."}


@mail_router.get("/unsubscribe", response_class=HTMLResponse)
def unsubscribe(request: Request, email: str, token: str):
    # TODO: Validate token and mark user as unsubscribed in your database
    # For now, just show a confirmation page
    # Implement your own logic to securely handle unsubscription
    return """
    <html>
      <head><title>Отписване от новини</title></head>
      <body style="font-family:Arial,sans-serif;">
        <h2>Успешно се отписахте от новините.</h2>
        <p>Няма да получавате повече имейли с новини от нас.</p>
      </body>
    </html>
    """