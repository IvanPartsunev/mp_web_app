from fastapi import APIRouter, HTTPException, Request, Depends
from starlette.responses import HTMLResponse
from mp_web_site.backend.auth.operations import decode_token, is_token_expired
from mp_web_site.backend.database.operations import UserRepository
from mp_web_site.backend.mail.operations import send_news_notification
from mp_web_site.backend.users.models import UserUpdate
from mp_web_site.backend.users.operations import update_user, get_user_repository

mail_router = APIRouter(tags=["email"])

@mail_router.post("/send-news")
async def send_notification(request: Request):
  user_id = "3902d331-0752-4785-9694-ab5afa5b18b7"
  user_email = "ivan.parcunev@gmail.com"
  link = "https://webcafe.bg/musiccafe/nay-dobrite-instrumentali-vav-veliki-rok-i-metal-albumi.html"
  send_news_notification(request, user_id, user_email, link)

@mail_router.get("/unsubscribe", response_class=HTMLResponse)
def unsubscribe(email: str, token: str, repo: UserRepository = Depends(get_user_repository)):
  user_data = UserUpdate(subscribed=False)
  payload = decode_token(token)
  user_id = payload.get("user_id")

  if not is_token_expired(token) and email == payload.get("sub") and payload.get("type") == "unsubscribe":
    update_user(user_id, email, user_data, repo)
    return """
        <html>
          <head><title>Отписване от новини</title></head>
          <body style="font-family:Arial,sans-serif;">
            <h2>Успешно се отписахте от новините.</h2>
            <p>Няма да получавате повече имейли с новини от нас.</p>
          </body>
        </html>
        """
  else:
    raise HTTPException(status_code=400, detail="Email mismatch or invalid token")
