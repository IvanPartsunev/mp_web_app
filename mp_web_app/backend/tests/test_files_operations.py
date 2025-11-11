from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from files.models import FileMetadata, FileMetadataFull, FileType
from files.operations import (
  _check_file_allowed_to_user,
  _create_file_name,
  _validate_metadata,
)


class TestCreateFileName:
  @patch("files.operations.get_allowed_file_extensions")
  @patch("files.operations.uuid4")
  @patch("files.operations.datetime")
  def test_creates_valid_filename_with_custom_name(self, mock_datetime, mock_uuid, mock_extensions):
    # Setup mocks
    mock_datetime.now.return_value = datetime(2024, 1, 15)
    # Mock uuid4 to return a string slice
    mock_uuid_obj = Mock()
    mock_uuid_obj.__getitem__ = Mock(return_value="abcd1234")
    mock_uuid.return_value = mock_uuid_obj
    mock_extensions.return_value = ["pdf", "doc", "txt"]

    result = _create_file_name("My Document", "original.pdf")

    assert result.startswith("2024_01_15_")
    assert "my_document" in result
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

    with pytest.raises(ValueError, match="File extension EXE not allowed"):
      _create_file_name("My File", "virus.exe")

  @patch("files.operations.get_allowed_file_extensions")
  @patch("files.operations.uuid4")
  @patch("files.operations.datetime")
  def test_cleans_special_characters(self, mock_datetime, mock_uuid, mock_extensions):
    mock_datetime.now.return_value = datetime(2024, 1, 15)
    mock_uuid.return_value = Mock(__getitem__=lambda self, key: "abcd1234"[: key.stop])
    mock_extensions.return_value = ["pdf"]

    result = _create_file_name("My@#$%Document!", "file.pdf")

    # Special characters should be removed
    assert "@" not in result
    assert "#" not in result
    assert "!" not in result
    assert "mydocument" in result

  @patch("files.operations.get_allowed_file_extensions")
  @patch("files.operations.uuid4")
  @patch("files.operations.datetime")
  def test_handles_spaces_and_dashes(self, mock_datetime, mock_uuid, mock_extensions):
    mock_datetime.now.return_value = datetime(2024, 1, 15)
    mock_uuid.return_value = Mock(__getitem__=lambda self, key: "abcd1234"[: key.stop])
    mock_extensions.return_value = ["pdf"]

    result = _create_file_name("My-Document Name", "file.pdf")

    # Spaces and dashes should be converted to underscores
    assert "my_document_name" in result


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

    result = _check_file_allowed_to_user(file_meta, user_id=None)
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

    result = _check_file_allowed_to_user(file_meta, user_id=None)
    assert result is False

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

    result = _check_file_allowed_to_user(file_meta, user_id="user123")
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

    result = _check_file_allowed_to_user(file_meta, user_id="user123")
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

    result = _check_file_allowed_to_user(file_meta, user_id="user123")
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

    result = _check_file_allowed_to_user(file_meta, user_id="user123")
    assert result is True
