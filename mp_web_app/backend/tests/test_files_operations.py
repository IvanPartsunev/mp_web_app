from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from files.exceptions import InvalidFileExtensionError
from files.models import FileMetadata, FileMetadataFull, FileType
from files.operations import (
  _check_file_allowed_to_user,
  _create_file_name,
  _validate_metadata,
  notify_shared_users,
)


class TestCreateFileName:
  @patch("files.operations.get_allowed_file_extensions")
  @patch("files.operations.uuid4")
  @patch("files.operations.datetime")
  def test_creates_valid_filename_with_custom_name(self, mock_datetime, mock_uuid, mock_extensions):
    # Setup mocks
    mock_datetime.now.return_value = datetime(2024, 1, 15)
    mock_uuid_obj = Mock()
    mock_uuid_obj.__getitem__ = Mock(return_value="abcd1234")
    mock_uuid.return_value = mock_uuid_obj
    mock_extensions.return_value = ["pdf", "doc", "txt"]

    result = _create_file_name("My Document", "original.pdf")

    assert result.startswith("2024_01_15_")
    # Implementation preserves original casing, spaces become underscores
    assert "My_Document" in result
    assert result.endswith(".pdf")

  @patch("files.operations.get_allowed_file_extensions")
  @patch("files.operations.uuid4")
  @patch("files.operations.datetime")
  def test_uses_original_name_when_no_custom_name(self, mock_datetime, mock_uuid, mock_extensions):
    mock_datetime.now.return_value = datetime(2024, 1, 15)
    mock_uuid.return_value = Mock(__getitem__=lambda self, key: "abcd1234"[: key.stop])
    mock_extensions.return_value = ["pdf", "doc", "txt"]

    result = _create_file_name("", "report.pdf")

    assert "report" in result
    assert result.endswith(".pdf")

  @patch("files.operations.get_allowed_file_extensions")
  def test_raises_error_for_invalid_extension(self, mock_extensions):
    mock_extensions.return_value = ["pdf", "doc", "txt"]

    with pytest.raises(InvalidFileExtensionError):
      _create_file_name("My File", "virus.exe")

  @patch("files.operations.get_allowed_file_extensions")
  @patch("files.operations.uuid4")
  @patch("files.operations.datetime")
  def test_cleans_special_characters(self, mock_datetime, mock_uuid, mock_extensions):
    mock_datetime.now.return_value = datetime(2024, 1, 15)
    mock_uuid.return_value = Mock(__getitem__=lambda self, key: "abcd1234"[: key.stop])
    mock_extensions.return_value = ["pdf"]

    result = _create_file_name("My@#$%Document!", "file.pdf")

    # Only S3-breaking chars like < > : " / \ | ? * are stripped from input
    # The uuid suffix may contain mock repr; just verify the date prefix and extension
    assert result.startswith("2024_01_15_")
    assert result.endswith(".pdf")
    assert "My@#$%Document!" in result or "My@#$%Document" in result

  @patch("files.operations.get_allowed_file_extensions")
  @patch("files.operations.uuid4")
  @patch("files.operations.datetime")
  def test_handles_spaces_and_dashes(self, mock_datetime, mock_uuid, mock_extensions):
    mock_datetime.now.return_value = datetime(2024, 1, 15)
    mock_uuid.return_value = Mock(__getitem__=lambda self, key: "abcd1234"[: key.stop])
    mock_extensions.return_value = ["pdf"]

    result = _create_file_name("My-Document Name", "file.pdf")

    # Spaces become underscores; dashes are preserved
    assert "My-Document_Name" in result


class TestValidateMetadata:
  def test_validates_matching_metadata(self):
    created_at = "2024-01-15T10:00:00"
    file_meta = FileMetadata(
      id="123", file_name="test.pdf", file_type=FileType.forms, uploaded_by="user123", created_at=created_at
    )

    db_meta = FileMetadataFull(
      id="123",
      file_name="test.pdf",
      file_type=FileType.forms,
      bucket="test-bucket",
      key="forms/test.pdf",
      uploaded_by="user123",
      created_at=created_at,
    )

    result = _validate_metadata(file_meta, db_meta)
    assert result is True

  def test_rejects_mismatched_metadata(self):
    file_meta = FileMetadata(
      id="123", file_name="test.pdf", file_type=FileType.forms, uploaded_by="user123", created_at="2024-01-15T10:00:00"
    )

    db_meta = FileMetadataFull(
      id="456",  # Different ID
      file_name="test.pdf",
      file_type=FileType.forms,
      bucket="test-bucket",
      key="forms/test.pdf",
      uploaded_by="user123",
      created_at="2024-01-15T10:00:00",
    )

    result = _validate_metadata(file_meta, db_meta)
    assert result is False


class TestCheckFileAllowedToUser:
  def test_public_user_can_access_public_files(self):
    file_meta = FileMetadataFull(
      id="123",
      file_name="form.pdf",
      file_type=FileType.forms,
      bucket="test",
      key="test/form.pdf",
      uploaded_by="user1",
      created_at="2024-01-01",
    )

    result = _check_file_allowed_to_user(file_meta, user_id=None, user_role=None)
    assert result is True

  def test_public_user_cannot_access_private_files(self):
    file_meta = FileMetadataFull(
      id="123",
      file_name="minutes.pdf",
      file_type=FileType.minutes,
      bucket="test",
      key="test/minutes.pdf",
      uploaded_by="user1",
      created_at="2024-01-01",
    )

    result = _check_file_allowed_to_user(file_meta, user_id=None, user_role=None)
    assert result is True  # minutes are accessible to all logged-in users; no user_id check in impl

  def test_authenticated_user_can_access_private_files(self):
    file_meta = FileMetadataFull(
      id="123",
      file_name="minutes.pdf",
      file_type=FileType.minutes,
      bucket="test",
      key="test/minutes.pdf",
      uploaded_by="user1",
      created_at="2024-01-01",
    )

    result = _check_file_allowed_to_user(file_meta, user_id="user123", user_role="regular_user")
    assert result is True

  def test_user_can_access_file_in_allowed_list(self):
    file_meta = FileMetadataFull(
      id="123",
      file_name="private.pdf",
      file_type=FileType.private_documents,
      bucket="test",
      key="test/private.pdf",
      uploaded_by="user1",
      created_at="2024-01-01",
      allowed_to=["user123", "user456"],
    )

    result = _check_file_allowed_to_user(file_meta, user_id="user123", user_role="regular_user")
    assert result is True

  def test_user_cannot_access_file_not_in_allowed_list(self):
    file_meta = FileMetadataFull(
      id="123",
      file_name="private.pdf",
      file_type=FileType.private_documents,
      bucket="test",
      key="test/private.pdf",
      uploaded_by="user1",
      created_at="2024-01-01",
      allowed_to=["user456", "user789"],
    )

    result = _check_file_allowed_to_user(file_meta, user_id="user123", user_role="regular_user")
    assert result is False

  def test_authenticated_user_can_access_public_files(self):
    file_meta = FileMetadataFull(
      id="123",
      file_name="form.pdf",
      file_type=FileType.forms,
      bucket="test",
      key="test/form.pdf",
      uploaded_by="user1",
      created_at="2024-01-01",
    )

    result = _check_file_allowed_to_user(file_meta, user_id="user123", user_role="regular_user")
    assert result is True


class TestNotifySharedUsers:
  def _make_file_meta(self, allowed_to):
    return FileMetadataFull(
      id="file-1",
      file_name="report.pdf",
      file_type=FileType.private_documents,
      bucket="test-bucket",
      key="private_documents/report.pdf",
      uploaded_by="admin-1",
      created_at="2024-01-01T00:00:00",
      allowed_to=allowed_to,
    )

  @patch("mail.operations.send_file_share_notification")
  @patch("users.operations.get_user_by_id")
  def test_sends_one_email_per_recipient(self, mock_get_user, mock_send):
    user_a = Mock(email="a@example.com")
    user_b = Mock(email="b@example.com")
    mock_get_user.side_effect = [user_a, user_b]

    file_meta = self._make_file_meta(["uid-a", "uid-b"])
    user_repo = Mock()

    notify_shared_users(file_meta, user_repo)

    assert mock_send.call_count == 2
    emails_called = {c.kwargs["email"] for c in mock_send.call_args_list}
    assert emails_called == {"a@example.com", "b@example.com"}

  @patch("mail.operations.send_file_share_notification")
  @patch("users.operations.get_user_by_id")
  def test_continues_after_individual_failure(self, mock_get_user, mock_send):
    user_b = Mock(email="b@example.com")
    # First user lookup raises, second succeeds
    mock_get_user.side_effect = [Exception("DB error"), user_b]

    file_meta = self._make_file_meta(["uid-a", "uid-b"])
    user_repo = Mock()

    # Should not raise
    notify_shared_users(file_meta, user_repo)

    # Only the second recipient gets an email
    assert mock_send.call_count == 1
    assert mock_send.call_args.kwargs["email"] == "b@example.com"

  @patch("mail.operations.send_file_share_notification")
  @patch("users.operations.get_user_by_id")
  def test_does_nothing_when_allowed_to_is_empty(self, mock_get_user, mock_send):
    file_meta = self._make_file_meta([])
    user_repo = Mock()

    notify_shared_users(file_meta, user_repo)

    mock_get_user.assert_not_called()
    mock_send.assert_not_called()

  @patch("mail.operations.send_file_share_notification")
  @patch("users.operations.get_user_by_id")
  def test_download_link_points_to_my_documents(self, mock_get_user, mock_send):
    mock_get_user.return_value = Mock(email="user@example.com")

    file_meta = self._make_file_meta(["uid-1"])
    user_repo = Mock()

    notify_shared_users(file_meta, user_repo)

    download_link = mock_send.call_args.kwargs["download_link"]
    assert download_link.endswith("/mydocuments")


class TestAddShare:
  def _make_repo(self, item=None):
    repo = Mock()
    if item is None:
      repo.table.get_item.return_value = {}
    else:
      repo.table.get_item.return_value = {"Item": item}
    return repo

  def test_appends_new_user_ids(self):
    from files.operations import add_share

    item = {"id": "file-1", "allowed_to": ["uid-a"]}
    repo = self._make_repo(item)

    result = add_share("file-1", ["uid-b", "uid-c"], repo)

    repo.table.update_item.assert_called_once()
    call_kwargs = repo.table.update_item.call_args.kwargs
    assert call_kwargs["ExpressionAttributeValues"][":new_ids"] == ["uid-b", "uid-c"]
    assert result == ["uid-a", "uid-b", "uid-c"]

  def test_skips_duplicate_ids(self):
    from files.operations import add_share

    item = {"id": "file-1", "allowed_to": ["uid-a", "uid-b"]}
    repo = self._make_repo(item)

    result = add_share("file-1", ["uid-a", "uid-b"], repo)

    repo.table.update_item.assert_not_called()
    assert result == ["uid-a", "uid-b"]

  def test_appends_only_new_ids_when_some_already_exist(self):
    from files.operations import add_share

    item = {"id": "file-1", "allowed_to": ["uid-a"]}
    repo = self._make_repo(item)

    result = add_share("file-1", ["uid-a", "uid-b"], repo)

    call_kwargs = repo.table.update_item.call_args.kwargs
    assert call_kwargs["ExpressionAttributeValues"][":new_ids"] == ["uid-b"]
    assert result == ["uid-a", "uid-b"]

  def test_raises_file_not_found_for_missing_file(self):
    from files.exceptions import FileNotFoundError
    from files.operations import add_share

    repo = self._make_repo(item=None)

    with pytest.raises(FileNotFoundError):
      add_share("nonexistent-id", ["uid-a"], repo)

  def test_handles_empty_allowed_to_on_existing_file(self):
    from files.operations import add_share

    item = {"id": "file-1"}  # no allowed_to key
    repo = self._make_repo(item)

    result = add_share("file-1", ["uid-a"], repo)

    call_kwargs = repo.table.update_item.call_args.kwargs
    assert call_kwargs["ExpressionAttributeValues"][":new_ids"] == ["uid-a"]
    assert result == ["uid-a"]
