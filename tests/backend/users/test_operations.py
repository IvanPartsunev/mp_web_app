import pytest
from users.operations import (
    validate_phone, validate_password, hash_password, verify_password,
    create_user, get_user_by_id
)
from users.models import UserCreate
from fastapi import HTTPException


def test_validate_phone_happy():
    assert validate_phone("0888123456").startswith("+359")


def test_validate_phone_invalid():
    with pytest.raises(ValueError):
        validate_phone("123")


def test_validate_password_happy():
    assert validate_password("GoodPass1!")


def test_validate_password_invalid():
    with pytest.raises(ValueError):
        validate_password("short")


def test_hash_and_verify_password(monkeypatch):
    pw = "Test123!"
    salt = "abcd"
    hashed = hash_password(pw, salt)
    assert verify_password(hashed, pw, salt) is True


def test_create_user_and_get_user(user_repo):
    user_data = UserCreate(
        email="test@example.com",
        phone="0888123456",
        password="StrongPass1!",
        user_code="code123",
    )
    user = create_user(user_data, request=None, repo=user_repo)
    assert user.email == "test@example.com"
    found = get_user_by_id(user.id, user_repo)
    assert found.id == user.id


def test_create_user_invalid_phone(user_repo):
    bad_data = UserCreate(
        email="bad@example.com",
        phone="123",
        password="StrongPass1!",
        user_code="code123",
    )
    with pytest.raises(ValueError):
        create_user(bad_data, request=None, repo=user_repo)
