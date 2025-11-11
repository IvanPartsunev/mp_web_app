from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException

from news.models import News, NewsType, NewsUpdate
from news.operations import (
  create_news,
  delete_news,
  get_news,
  update_news,
)


@pytest.fixture
def mock_repo():
  repo = Mock()
  repo.table = Mock()
  repo.convert_item_to_object = Mock()
  return repo


class TestCreateNews:
  def test_creates_news_successfully(self, mock_repo):
    mock_repo.table.put_item = Mock()
    mock_repo.convert_item_to_object = Mock(return_value=Mock())

    news_data = News(title="Test News", content="Test content", news_type=NewsType.regular)

    result = create_news(news_data, mock_repo, "user123")

    assert result is not None
    mock_repo.table.put_item.assert_called_once()

    # Verify item structure
    call_args = mock_repo.table.put_item.call_args[1]
    item = call_args["Item"]
    assert item["title"] == "Test News"
    assert item["content"] == "Test content"
    assert item["author_id"] == "user123"
    assert item["news_type"] == NewsType.regular
    assert "id" in item
    assert "created_at" in item

  def test_handles_database_error(self, mock_repo):
    from botocore.exceptions import ClientError

    mock_repo.table.put_item.side_effect = ClientError({"Error": {"Message": "DB Error"}}, "put_item")

    news_data = News(title="Test News", content="Test content", news_type=NewsType.regular)

    with pytest.raises(HTTPException) as exc_info:
      create_news(news_data, mock_repo, "user123")

    assert exc_info.value.status_code == 500


class TestDeleteNews:
  @patch("news.operations.get_news")
  def test_deletes_existing_news(self, mock_get_news, mock_repo):
    mock_news = Mock()
    mock_get_news.return_value = mock_news
    mock_repo.table.delete_item = Mock()

    result = delete_news("news123", mock_repo)

    assert result is True
    mock_repo.table.delete_item.assert_called_once_with(Key={"id": "news123"})

  @patch("news.operations.get_news")
  def test_returns_false_for_nonexistent_news(self, mock_get_news, mock_repo):
    mock_get_news.return_value = None

    result = delete_news("news123", mock_repo)

    assert result is False
    mock_repo.table.delete_item.assert_not_called()


class TestUpdateNews:
  @patch("news.operations.get_news")
  def test_updates_news_successfully(self, mock_get_news, mock_repo):
    mock_news = Mock()
    mock_get_news.return_value = mock_news

    mock_repo.table.update_item = Mock(return_value={"Attributes": {"id": "news123", "title": "Updated Title"}})
    mock_repo.convert_item_to_object = Mock(return_value=mock_news)

    news_update = NewsUpdate(title="Updated Title", content="Updated content", news_type=NewsType.regular)

    result = update_news(news_update, "news123", "user123", mock_repo)

    assert result is not None
    mock_repo.table.update_item.assert_called_once()

    # Verify update expression includes edited_by
    call_args = mock_repo.table.update_item.call_args[1]
    assert ":edited_by" in call_args["ExpressionAttributeValues"]
    assert call_args["ExpressionAttributeValues"][":edited_by"] == "user123"

  @patch("news.operations.get_news")
  def test_returns_none_for_nonexistent_news(self, mock_get_news, mock_repo):
    mock_get_news.return_value = None

    news_update = NewsUpdate(title="Updated Title", content="Updated content", news_type=NewsType.regular)
    result = update_news(news_update, "news123", "user123", mock_repo)

    assert result is None
    mock_repo.table.update_item.assert_not_called()


class TestGetNews:
  def test_gets_single_news_by_id(self, mock_repo):
    mock_item = {"id": "news123", "title": "Test News"}
    mock_repo.table.get_item = Mock(return_value={"Item": mock_item})
    mock_repo.convert_item_to_object = Mock(return_value=mock_item)

    result = get_news(mock_repo, news_id="news123")

    assert result is not None
    mock_repo.table.get_item.assert_called_once_with(Key={"id": "news123"})

  def test_returns_none_for_nonexistent_news(self, mock_repo):
    mock_repo.table.get_item = Mock(return_value={})

    result = get_news(mock_repo, news_id="news123")

    assert result is None

  @patch("news.operations.is_token_expired")
  def test_gets_all_news_with_valid_token(self, mock_is_expired, mock_repo):
    mock_is_expired.return_value = False
    mock_repo.table.query = Mock(
      return_value={"Items": [{"id": "1", "news_type": "regular"}, {"id": "2", "news_type": "private"}]}
    )

    result = get_news(mock_repo, token="valid_token")

    assert len(result) == 2
    # Should not filter when token is valid
    call_args = mock_repo.table.query.call_args[1]
    assert "FilterExpression" not in call_args

  @patch("news.operations.is_token_expired")
  def test_filters_private_news_without_token(self, mock_is_expired, mock_repo):
    mock_is_expired.return_value = True
    mock_repo.table.query = Mock(return_value={"Items": [{"id": "1", "news_type": "regular"}]})

    result = get_news(mock_repo, token=None)

    # Should filter private news
    call_args = mock_repo.table.query.call_args[1]
    assert "FilterExpression" in call_args
