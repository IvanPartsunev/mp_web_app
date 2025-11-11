from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from auth.operations import role_required
from database.repositories import NewsRepository
from news.models import News, NewsUpdate
from news.operations import create_news, delete_news, get_news, get_news_repository, update_news
from users.roles import UserRole

news_router = APIRouter(tags=["news"])


@news_router.get("/get", status_code=status.HTTP_200_OK)
async def news_get(
  news_repo: NewsRepository = Depends(get_news_repository),
  token: Optional[str] = None,  # Query param (legacy support)
  authorization: Optional[str] = Header(None),  # Authorization header (standard)
):
  # Prefer Authorization header (standard), fallback to query param (legacy)
  auth_token = None
  if authorization and authorization.startswith("Bearer "):
    auth_token = authorization.replace("Bearer ", "")
  elif token:
    auth_token = token

  return get_news(repo=news_repo, token=auth_token)


@news_router.post("/upload", status_code=status.HTTP_201_CREATED)
async def news_upload(
  request: Request,
  news_data: News,
  news_repo: NewsRepository = Depends(get_news_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    return create_news(news_data=news_data, repo=news_repo, user_id=user.id, request=request)
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exception raised during the News upload: {e}")


@news_router.post("/update", status_code=status.HTTP_200_OK)
async def news_update(
  update: NewsUpdate,
  news_id: str,
  news_repo: NewsRepository = Depends(get_news_repository),
  user=Depends(role_required([UserRole.ADMIN])),
):
  try:
    return update_news(news_update=update, repo=news_repo, user_id=user.id, news_id=news_id)
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Exception raised during the News upload: {e}")


@news_router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
async def news_delete(
  news_id: str, news_repo: NewsRepository = Depends(get_news_repository), user=Depends(role_required([UserRole.ADMIN]))
):
  return delete_news(news_id=news_id, repo=news_repo)
