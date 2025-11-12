from fastapi import APIRouter, Depends, HTTPException, Request
from starlette import status
from starlette.responses import HTMLResponse

from auth.operations import decode_token, is_token_expired
from database.repositories import UserRepository
from mail.exceptions import EmailSendError, InvalidTokenError
from mail.operations import construct_reset_link, send_news_notification, send_reset_email
from users.models import UserUpdate, UserUpdatePasswordEmail
from users.operations import get_user_by_email, get_user_repository, update_user

mail_router = APIRouter(tags=["email"])


@mail_router.post("/send-news", status_code=status.HTTP_200_OK)
async def send_notification(request: Request, user_id: str, user_email: str, link: str):
  try:
    user_id = user_id
    user_email = user_email
    link = link
    send_news_notification(request, user_id, user_email, link)
  except EmailSendError as e:
    raise HTTPException(status_code=500, detail=str(e))


@mail_router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def send_reset_request(user_data: UserUpdatePasswordEmail, repo: UserRepository = Depends(get_user_repository)):
  try:
    email = user_data.email
    user = get_user_by_email(email, repo, secret=True)
    user_id = user.id
    link = construct_reset_link(user_id, email)
    send_reset_email(email, link)
  except EmailSendError as e:
    raise HTTPException(status_code=500, detail=str(e))


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
