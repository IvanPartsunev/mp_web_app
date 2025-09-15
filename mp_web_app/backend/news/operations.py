import os
from datetime import datetime, timedelta
from uuid import uuid4

from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from fastapi import HTTPException

from auth.operations import is_token_expired
from database.operations import NewsRepository
from news.models import News, NewsUpdate, NewsType

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
  created_at = datetime.now().isoformat()
  updated_at = datetime.now().isoformat()

  news_item = {
    "id": news_id,
    "news": "news",
    "title": title,
    "content": content,
    "author_id": author_id,
    "edited_by": None,
    "news_type": news_type,
    "created_at": created_at,
    "updated_at": updated_at,
  }

  try:
    repo.table.put_item(Item=news_item)
  except ClientError as e:
    raise HTTPException(
      status_code=500,
      detail=f"Database error: {e.response['Error']['Message']}"
    )
  return repo.convert_item_to_object(news_item)


def delete_news(news_id: str, repo: NewsRepository):
  existing_news = get_news(repo, news_id)
  if not existing_news:
    return False

  repo.table.delete_item(Key={"id": news_id})
  return True


def update_news(news_update: NewsUpdate, news_id: str, user_id: str, repo: NewsRepository):
  existing_news = get_news(repo, news_id)

  if not existing_news:
    return None

  # Build update expression
  update_expression_parts = []
  expression_attribute_values = {}
  expression_attribute_names = {}

  # Add updated_at timestamp
  update_expression_parts.append("#updated_at = :updated_at")
  expression_attribute_values[":updated_at"] = datetime.now().isoformat()
  expression_attribute_names["#updated_at"] = "updated_at"

  update_expression_parts.append("#edited_by = :edited_by")
  expression_attribute_values[":edited_by"] = user_id
  expression_attribute_names["#edited_by"] = "edited_by"

  # Add other fields if they are provided
  if news_update.title is not None:
    update_expression_parts.append("#title = :title")
    expression_attribute_values[":title"] = news_update.title
    expression_attribute_names["#title"] = "title"

  if news_update.content is not None:
    update_expression_parts.append("#content = :content")
    expression_attribute_values[":content"] = news_update.content
    expression_attribute_names["#content"] = "content"

  if news_update.news_type is not None:
    update_expression_parts.append("#news_type = :news_type")
    expression_attribute_values[":news_type"] = news_update.news_type
    expression_attribute_names["#news_type"] = "news_type"

  # Build the update expression
  update_expression = "SET " + ", ".join(update_expression_parts)

  # Update the item
  response = repo.table.update_item(
    Key={"id": news_id},
    UpdateExpression=update_expression,
    ExpressionAttributeValues=expression_attribute_values,
    ExpressionAttributeNames=expression_attribute_names,
    ReturnValues="ALL_NEW",
  )

  return repo.convert_item_to_object(response["Attributes"])


def get_news(repo: NewsRepository, news_id: str | None = None, token: str | None = None):
  if news_id:
    response = repo.table.get_item(Key={"id": news_id})
    if "Item" not in response:
      return None
    return repo.convert_item_to_object(response["Item"])

  one_year_ago = datetime.now() - timedelta(days=365)
  one_year_ago_iso = one_year_ago.isoformat()

  query_kwargs = {
    "IndexName": 'news_created_at_index',
    "KeyConditionExpression": Key("news").eq('news') & Key('created_at').gte(one_year_ago_iso),
    "ScanIndexForward": False,
  }

  if not token or is_token_expired(token):
    query_kwargs['FilterExpression'] = Attr('news_type').eq(NewsType.regular)

  response = repo.table.query(**query_kwargs)
  items = response['Items']

  while 'LastEvaluatedKey' in response:
    response = repo.table.query(**query_kwargs)
    items.extend(response['Items'])
  return items



