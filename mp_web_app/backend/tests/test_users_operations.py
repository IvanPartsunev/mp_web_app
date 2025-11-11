from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException

from users.models import UserCreate, UserUpdate
from users.operations import (
  create_user,
  delete_user,
  hash_password,
  update_user,
  validate_password,
  validate_phone,
  verify_password,
)


class TestValidatePhone:
  def test_converts_local_to_international(self):
    result = validate_phone("0889123456")
    assert result == "+359889123456"

  def test_accepts_international_format(self):
    result = validate_phone("+359889123456")
    assert result == "+359889123456"

  def test_rejects_invalid_length(self):
    with pytest.raises(ValueError, match="must be 10 or 13 digits"):
      validate_phone("123")

  def test_rejects_invalid_prefix(self):
    with pytest.raises(ValueError, match="must start with"):
      validate_phone("1234567890")


class TestValidatePassword:
  def test_accepts_valid_password(self):
    result = validate_password("Test123!")
    assert result == "Test123!"

  def test_rejects_too_short(self):
    with pytest.raises(ValueError, match="at least 8 characters"):
      validate_password("Test1!")

  def test_rejects_too_long(self):
    with pytest.raises(ValueError, match="less than 30 characters"):
      validate_password("T" * 31 + "est123!")

  def test_rejects_no_uppercase(self):
    with pytest.raises(ValueError, match="uppercase letter"):
      validate_password("test123!")

  def test_rejects_no_lowercase(self):
    with pytest.raises(ValueError, match="lowercase letter"):
      validate_password("TEST123!")

  def test_rejects_no_digit(self):
    with pytest.raises(ValueError, match="digit"):
      validate_password("TestTest!")

  def test_rejects_no_special_char(self):
    with pytest.raises(ValueError, match="special symbol"):
      validate_password("Test1234")


class TestHashAndVerifyPassword:
  def test_hash_and_verify_success(self):
    password = "TestPassword123!"
    salt = "test_salt"

    hashed = hash_password(password, salt)

    assert hashed is not None
    assert hashed != password
    assert verify_password(hashed, password, salt) is True

  def test_verify_fails_wrong_password(self):
    password = "TestPassword123!"
    salt = "test_salt"
    hashed = hash_password(password, salt)

    assert verify_password(hashed, "WrongPassword123!", salt) is False

  def test_verify_fails_wrong_salt(self):
    password = "TestPassword123!"
    salt = "test_salt"
    hashed = hash_password(password, salt)

    assert verify_password(hashed, password, "wrong_salt") is False


class TestCreateUser:
  @patch("users.operations.validate_password")
  @patch("users.operations.validate_phone")
  @patch("users.operations.hash_password")
  def test_creates_user_successfully(self, mock_hash, mock_phone, mock_password):
    mock_password.return_value = "ValidPass123!"
    mock_phone.return_value = "+359889123456"
    mock_hash.return_value = "hashed_password"

    mock_repo = Mock()
    mock_repo.table.put_item = Mock()
    mock_repo.convert_item_to_object = Mock(return_value=Mock())

    mock_request = Mock()

    user_data = UserCreate(
      first_name="John",
      last_name="Doe",
      email="john@example.com",
      phone="0889123456",
      password="ValidPass123!",
      member_code="CODE123",
    )

    result = create_user(user_data, mock_request, mock_repo)

    assert result is not None
    mock_repo.table.put_item.assert_called_once()

    # Verify item structure
    call_args = mock_repo.table.put_item.call_args[1]
    item = call_args["Item"]
    assert item["email"] == "john@example.com"
    assert item["first_name"] == "John"
    assert item["phone"] == "+359889123456"
    assert item["active"] is False
    assert item["subscribed"] is True

  @patch("users.operations.validate_password")
  def test_raises_error_on_invalid_password(self, mock_password):
    mock_password.side_effect = ValueError("Password too short")

    mock_repo = Mock()
    mock_request = Mock()

    user_data = UserCreate(
      first_name="John",
      last_name="Doe",
      email="john@example.com",
      phone="0889123456",
      password="short",
      member_code="CODE123",
    )

    with pytest.raises(HTTPException) as exc_info:
      create_user(user_data, mock_request, mock_repo)

    assert exc_info.value.status_code == 400


class TestUpdateUser:
  @patch("users.operations.get_user_by_email")
  def test_updates_user_successfully(self, mock_get_user):
    mock_user = Mock()
    mock_user.id = "user123"
    mock_get_user.return_value = mock_user

    mock_repo = Mock()
    mock_repo.table.update_item = Mock(return_value={"Attributes": {"id": "user123", "role": "admin"}})
    mock_repo.convert_item_to_object = Mock(return_value=mock_user)

    user_data = UserUpdate(role="admin", active=True)

    result = update_user("user123", "test@example.com", user_data, mock_repo)

    assert result is not None
    mock_repo.table.update_item.assert_called_once()

  @patch("users.operations.get_user_by_email")
  def test_returns_none_for_nonexistent_user(self, mock_get_user):
    mock_get_user.return_value = None

    mock_repo = Mock()
    user_data = UserUpdate(role="admin")

    result = update_user("user123", "test@example.com", user_data, mock_repo)

    assert result is None


class TestDeleteUser:
  @patch("users.operations.get_user_by_email")
  def test_deletes_existing_user(self, mock_get_user):
    mock_user = Mock()
    mock_user.id = "user123"
    mock_get_user.return_value = mock_user

    mock_repo = Mock()
    mock_repo.table.delete_item = Mock()

    result = delete_user("test@example.com", mock_repo)

    assert result is True
    mock_repo.table.delete_item.assert_called_once_with(Key={"id": "user123"})

  @patch("users.operations.get_user_by_email")
  def test_returns_false_for_nonexistent_user(self, mock_get_user):
    mock_get_user.return_value = None

    mock_repo = Mock()
    result = delete_user("test@example.com", mock_repo)

    assert result is False
    mock_repo.table.delete_item.assert_not_called()
