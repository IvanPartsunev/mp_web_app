from fastapi import APIRouter, HTTPException, Request
from starlette.responses import HTMLResponse
from mp_web_site.backend.auth.operations import decode_token, is_token_expired
from mp_web_site.backend.database.operations import UserRepository

mail_router = APIRouter(tags=["email"])

@mail_router.post("/unsubscribe", response_class=HTMLResponse)
def unsubscribe(request: Request, email: str, token: str):
  # TODO: Validate token and mark user as unsubscribed in your database
  # For now, just show a confirmation page
  # Implement your own logic to securely handle unsubscription
  payload = decode_token(token)
  token_email = payload.get("sub")

  if not is_token_expired(token) and token == token_email:
    user_repo = UserRepository()

  else:
    raise HTTPException(status_code=400, detail="Email mismatch or invalid token")


  return """
        <html>
          <head><title>Отписване от новини</title></head>
          <body style="font-family:Arial,sans-serif;">
            <h2>Успешно се отписахте от новините.</h2>
            <p>Няма да получавате повече имейли с новини от нас.</p>
          </body>
        </html>
        """