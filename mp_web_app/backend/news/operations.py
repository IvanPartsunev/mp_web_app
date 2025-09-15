import os
from datetime import datetime
from uuid import uuid4

from botocore.exceptions import ClientError
from fastapi import HTTPException

from database.operations import NewsRepository, UserRepository
from news.models import News

NEWS_TABLE_NAME = os.environ.get('NEWS_TABLE_NAME')


def get_news_repository() -> NewsRepository:
  """Dependency to get the news repository."""
  return NewsRepository(NEWS_TABLE_NAME)


def create_news(news_data: News, repo: NewsRepository, user_id: str):
  news_id = str(uuid4())
  title = news_data.title
  content = news_data.content
  author_id = user_id
  news_type = news_data.news_type
  created_at = datetime.now()
  updated_at = datetime.now()

  news_item = {
    "id": news_id,
    "title": title,
    "content": content,
    "author_id": author_id,
    "news_type": news_type,
    "created_at": created_at,
    "updated_at": updated_at,
  }

  try:
    repo.table.put_items(Item=news_item)
  except ClientError as e:
    raise HTTPException(
      status_code=500,
      detail=f"Database error: {e.response['Error']['Message']}"
    )
  return repo.convert_item_to_object(news_item)


def delete_news():
  ...


def update_news():
  ...


def get_news():
  ...