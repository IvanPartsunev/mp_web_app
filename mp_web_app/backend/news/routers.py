from fastapi import APIRouter, status

from news.models import News
from news.operations import create_news

news_router = APIRouter(tags=["news"])

@news_router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_news(
    news_data: News,
  # user=Depends(role_required([UserRole.ADMIN])) # TODO Uncomment this
):
  create_news()