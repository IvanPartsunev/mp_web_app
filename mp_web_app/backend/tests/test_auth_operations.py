from datetime import UTC, datetime, timedelta
from unittest.mock import Mock, patch

import pytest
from jose import jwt

from auth.operations import (
  authenticate_user,
  decode_token,
  generate_access_token,
  generate_activation_token,
  generate_refresh_token,
  generate_reset_token,
  generate_unsubscribe_token,
  is_token_expired,
)


@pytest.fixture
def mock_jwt_settings():
  with patch("auth.operations.get_jwt_settings") as mock:
    settings = Mock()
    settings.secret_key = "test_secret_key"
    settings.algorithm = "HS256"
    mock.return_value = settings
    yield mock


@pytest.fixture
def mock_repo():
  repo = Mock()
  repo.table = Mock()
  return repo


class TestGenerateAccessToken:
  def test_generates_valid_token(self, mock_jwt_settings):
    data = {"sub": "user123", "role": "admin"}
    token = generate_access_token(data)

    assert token is not None
    assert isinstance(token, str)

    # Decode and verify
    payload = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
    assert payload["sub"] == "user123"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"
    assert "exp" in payload

  def test_respects_custom_expiry(self, mock_jwt_settings):
    data = {"sub": "user123"}
    custom_delta = timedelta(hours=2)
    token = generate_access_token(data, expires_delta=custom_delta)

    payload = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
    exp_time = datetime.fromtimestamp(payload["exp"], tz=UTC)
    now = datetime.now(UTC)

    # Should expire in roughly 2 hours
    assert (exp_time - now).total_seconds() > 7000  # ~2 hours


class TestGenerateRefreshToken:
  def test_generates_and_stores_token(self, mock_jwt_settings, mock_repo):
    data = {"sub": "user123"}
    token = generate_refresh_token(data, mock_repo)

    assert token is not None
    assert isinstance(token, str)

    # Verify DB call
    mock_repo.table.put_item.assert_called_once()
    call_args = mock_repo.table.put_item.call_args[1]
    item = call_args["Item"]

    assert item["user_id"] == "user123"
    assert item["valid"] is True
    assert "id" in item
    assert "expires_at" in item


class TestDecodeToken:
  def test_decodes_valid_token(self, mock_jwt_settings):
    data = {"sub": "user123", "role": "admin"}
    token = generate_access_token(data)

    payload = decode_token(token)

    assert payload is not None
    assert payload["sub"] == "user123"
    assert payload["role"] == "admin"

  def test_returns_none_for_invalid_token(self, mock_jwt_settings):
    payload = decode_token("invalid_token")
    assert payload is None


class TestIsTokenExpired:
  def test_returns_true_for_expired_token(self, mock_jwt_settings):
    # Create token that expired 1 hour ago
    data = {"sub": "user123"}
    past_time = datetime.now(UTC) - timedelta(hours=1)
    expired_token = jwt.encode({**data, "exp": past_time.timestamp()}, "test_secret_key", algorithm="HS256")

    assert is_token_expired(expired_token) is True

  def test_returns_false_for_valid_token(self, mock_jwt_settings):
    data = {"sub": "user123"}
    token = generate_access_token(data)

    assert is_token_expired(token) is False

  def test_returns_true_for_invalid_token(self, mock_jwt_settings):
    assert is_token_expired("invalid_token") is True


class TestAuthenticateUser:
  @patch("auth.operations.get_user_by_email")
  @patch("auth.operations.verify_password")
  def test_authenticates_valid_user(self, mock_verify, mock_get_user):
    mock_user = Mock()
    mock_user.email = "test@example.com"
    mock_user.password_hash = "hashed_password"
    mock_user.salt = "salt123"

    mock_get_user.return_value = mock_user
    mock_verify.return_value = True

    mock_repo = Mock()
    result = authenticate_user("test@example.com", "password123", mock_repo)

    assert result == mock_user
    mock_get_user.assert_called_once_with("test@example.com", mock_repo, secret=True)
    mock_verify.assert_called_once()

  @patch("auth.operations.get_user_by_email")
  def test_returns_none_for_nonexistent_user(self, mock_get_user):
    mock_get_user.return_value = None

    mock_repo = Mock()
    result = authenticate_user("test@example.com", "password123", mock_repo)

    assert result is None

  @patch("auth.operations.get_user_by_email")
  @patch("auth.operations.verify_password")
  def test_returns_none_for_wrong_password(self, mock_verify, mock_get_user):
    mock_user = Mock()
    mock_get_user.return_value = mock_user
    mock_verify.return_value = False

    mock_repo = Mock()
    result = authenticate_user("test@example.com", "wrong_password", mock_repo)

    assert result is None


class TestSpecialTokenGeneration:
  def test_generate_activation_token(self, mock_jwt_settings):
    token = generate_activation_token("user123", "test@example.com")

    assert token is not None
    payload = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
    assert payload["sub"] == "test@example.com"
    assert payload["user_id"] == "user123"
    assert payload["type"] == "activation"

  def test_generate_unsubscribe_token(self, mock_jwt_settings):
    token = generate_unsubscribe_token("user123", "test@example.com")

    assert token is not None
    payload = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
    assert payload["type"] == "unsubscribe"

  def test_generate_reset_token(self, mock_jwt_settings):
    token = generate_reset_token("user123", "test@example.com")

    assert token is not None
    payload = jwt.decode(token, "test_secret_key", algorithms=["HS256"])
    assert payload["type"] == "reset"
