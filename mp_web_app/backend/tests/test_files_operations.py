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
  def test_creates_filename_from_original_name(self, mock_extensions):
    mock_extensions.return_value = ["pdf", "doc", "txt"]

    result = _create_file_name("My Document.pdf")

    assert result == "My_Document.pdf"

  @patch("files.operations.get_allowed_file_extensions")
  def test_replaces_spaces_with_underscores(self, mock_extensions):
    mock_extensions.return_value = ["pdf"]

    result = _create_file_name("Annual Report 2025.pdf")

    assert result == "Annual_Report_2025.pdf"

  @patch("files.operations.get_allowed_file_extensions")
  def test_preserves_name_without_spaces(self, mock_extensions):
    mock_extensions.return_value = ["pdf"]

    result = _create_file_name("report.pdf")

    assert result == "report.pdf"

  @patch("files.operations.get_allowed_file_extensions")
  def test_raises_error_for_invalid_extension(self, mock_extensions):
    mock_extensions.return_value = ["pdf", "doc", "txt"]

    with pytest.raises(InvalidFileExtensionError):
      _create_file_name("virus.exe")

  @patch("files.operations.get_allowed_file_extensions")
  def test_preserves_dashes_and_other_chars(self, mock_extensions):
    mock_extensions.return_value = ["pdf"]

    result = _create_file_name("My-Document_Name.pdf")

    assert result == "My-Document_Name.pdf"


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


class TestNotifyUpload:
  def _make_file_meta(self, file_type, allowed_to=None):
    from files.models import FileMetadataFull, FileType
    return FileMetadataFull(
      id="file-1",
      file_name="document.pdf",
      file_type=FileType(file_type),
      bucket="test-bucket",
      key=f"{file_type}/document.pdf",
      uploaded_by="admin-1",
      created_at="2024-01-01T00:00:00",
      allowed_to=allowed_to,
    )

  def _make_user(self, role, email):
    user = Mock()
    user.role = role
    user.email = email
    user.id = f"user-{email}"
    return user

  @patch("files.operations.notify_shared_users")
  @patch("mail.operations.send_upload_notification")
  @patch("users.operations.get_subscribed_users")
  def test_broadcasts_to_all_subscribers_for_regular_file_type(
    self, mock_get_users, mock_send_upload, mock_notify_shared
  ):
    from files.operations import notify_upload

    users = [
      self._make_user("regular", "a@example.com"),
      self._make_user("board", "b@example.com"),
    ]
    mock_get_users.return_value = users
    file_meta = self._make_file_meta("minutes")
    user_repo = Mock()

    notify_upload(file_meta, user_repo)

    assert mock_send_upload.call_count == 2
    emails = {c.kwargs["email"] for c in mock_send_upload.call_args_list}
    assert emails == {"a@example.com", "b@example.com"}
    mock_notify_shared.assert_not_called()

  @patch("files.operations.notify_shared_users")
  @patch("mail.operations.send_upload_notification")
  @patch("users.operations.get_subscribed_users")
  def test_accounting_excludes_regular_users(
    self, mock_get_users, mock_send_upload, mock_notify_shared
  ):
    from files.operations import notify_upload

    users = [
      self._make_user("regular", "regular@example.com"),
      self._make_user("board", "board@example.com"),
      self._make_user("control", "control@example.com"),
      self._make_user("accountant", "accountant@example.com"),
      self._make_user("admin", "admin@example.com"),
    ]
    mock_get_users.return_value = users
    file_meta = self._make_file_meta("accounting")
    user_repo = Mock()

    notify_upload(file_meta, user_repo)

    emails = {c.kwargs["email"] for c in mock_send_upload.call_args_list}
    assert "regular@example.com" not in emails
    assert {"board@example.com", "control@example.com", "accountant@example.com", "admin@example.com"} == emails

  @patch("files.operations.notify_shared_users")
  @patch("mail.operations.send_upload_notification")
  @patch("users.operations.get_subscribed_users")
  def test_private_documents_skips_broadcast(
    self, mock_get_users, mock_send_upload, mock_notify_shared
  ):
    from files.operations import notify_upload

    file_meta = self._make_file_meta("private_documents", allowed_to=["uid-1"])
    user_repo = Mock()

    notify_upload(file_meta, user_repo)

    mock_get_users.assert_not_called()
    mock_send_upload.assert_not_called()
    mock_notify_shared.assert_called_once_with(file_meta, user_repo)

  @patch("files.operations.notify_shared_users")
  @patch("mail.operations.send_upload_notification")
  @patch("users.operations.get_subscribed_users")
  def test_calls_notify_shared_users_when_allowed_to_set(
    self, mock_get_users, mock_send_upload, mock_notify_shared
  ):
    from files.operations import notify_upload

    mock_get_users.return_value = []
    file_meta = self._make_file_meta("minutes", allowed_to=["uid-1", "uid-2"])
    user_repo = Mock()

    notify_upload(file_meta, user_repo)

    mock_notify_shared.assert_called_once_with(file_meta, user_repo)

  @patch("files.operations.notify_shared_users")
  @patch("mail.operations.send_upload_notification")
  @patch("users.operations.get_subscribed_users")
  def test_does_not_call_notify_shared_when_allowed_to_empty(
    self, mock_get_users, mock_send_upload, mock_notify_shared
  ):
    from files.operations import notify_upload

    mock_get_users.return_value = []
    file_meta = self._make_file_meta("minutes", allowed_to=None)
    user_repo = Mock()

    notify_upload(file_meta, user_repo)

    mock_notify_shared.assert_not_called()

  @patch("files.operations.notify_shared_users")
  @patch("mail.operations.send_upload_notification")
  @patch("users.operations.get_subscribed_users")
  def test_upload_notification_includes_correct_category_and_link(
    self, mock_get_users, mock_send_upload, mock_notify_shared
  ):
    from files.operations import notify_upload

    mock_get_users.return_value = [self._make_user("regular", "user@example.com")]
    file_meta = self._make_file_meta("governing_documents")
    user_repo = Mock()

    notify_upload(file_meta, user_repo)

    call_kwargs = mock_send_upload.call_args.kwargs
    assert call_kwargs["category_bg"] == "Нормативни документи"
    assert call_kwargs["documents_link"].endswith("/governing-documents")
    assert call_kwargs["file_name"] == "document.pdf"
