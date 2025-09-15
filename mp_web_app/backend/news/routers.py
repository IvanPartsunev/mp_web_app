from fastapi import APIRouter, status, Depends, HTTPException

from auth.operations import role_required
from database.operations import NewsRepository
from news.models import News
from news.operations import create_news, get_news_repository
from users.roles import UserRole

news_router = APIRouter(tags=["news"])


@news_router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_news(
    news_data: News,
    news_repo: NewsRepository = Depends(get_news_repository),
    user=Depends(role_required([UserRole.REGULAR_USER])) # TODO change to ADMIN

):
  try:
    return create_news(news_data=news_data, repo=news_repo, user_id=user.id)
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exception raised during the News upload: {e}")