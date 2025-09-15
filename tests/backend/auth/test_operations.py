import pytest
from jose import jwt
from fastapi import HTTPException
from auth.operations import (
    generate_access_token, decode_token, is_token_expired,
    generate_refresh_token, verify_refresh_token, invalidate_token
)
from auth.models import TokenPayload


def test_generate_and_decode_access_token(monkeypatch):
    monkeypatch.setattr(jwt, "encode", lambda data, key, algo: "encoded")
    token = generate_access_token({"sub": "user1"})
    assert token == "encoded"


def test_decode_token_invalid(monkeypatch):
    monkeypatch.setattr(jwt, "decode", lambda t, k, a: (_ for _ in ()).throw(Exception("bad")))
    assert decode_token("invalid") is None


def test_is_token_expired_true(monkeypatch):
    monkeypatch.setattr("auth.operations.decode_token", lambda _: {"exp": 0})
    assert is_token_expired("token") is True


def test_generate_and_verify_refresh_token(auth_repo, monkeypatch):
    monkeypatch.setattr(jwt, "encode", lambda data, key, algo: "refresh")
    token = generate_refresh_token({"sub": "user1"}, repo=auth_repo)
    assert token == "refresh"
    # fake decode returns valid payload
    monkeypatch.setattr("auth.operations.decode_token",
                        lambda _: {"type": "refresh", "sub": "user1", "role": "r", "exp": 999999, "jti": "jid", "valid": True})
    payload = verify_refresh_token("refresh")
    assert isinstance(payload, TokenPayload)


def test_invalidate_token(auth_repo):
    # prepare token
    auth_repo.table.put_item({"id": "jid", "user_id": "u1", "valid": True})
    payload = TokenPayload(sub="u1", role="r", exp=9999, type="refresh", jti="jid")
    invalidate_token(payload, auth_repo)
    assert auth_repo.table.items["jid"]["valid"] is False


def test_verify_refresh_token_invalid_type(monkeypatch):
    monkeypatch.setattr("auth.operations.decode_token",
                        lambda _: {"type": "access", "sub": "user1"})
    with pytest.raises(HTTPException):
        verify_refresh_token("bad")
