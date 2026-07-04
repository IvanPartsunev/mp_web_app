"""
Tests for members operations module.
"""

import io
from unittest.mock import AsyncMock, MagicMock, Mock, call, patch

import asyncio

import pytest

from botocore.exceptions import ClientError
from database.exceptions import DatabaseError
from members.exceptions import InvalidFileTypeError, MemberNotFoundError, ValidationError
from members.models import Member, MemberUpdate
from members.operations import (
  _normalize_members,
  convert_members_list,
  delete_member,
  get_member_by_code,
  is_member_code_valid,
  is_valid_file_type,
  list_members,
  members_list_to_csv,
  sync_members_list,
  update_member,
  update_member_code,
)


@pytest.fixture
def mock_repo():
  repo = Mock()
  repo.table = Mock()
  repo.convert_item_to_object = Mock()
  return repo


def make_member(**kwargs) -> Member:
  defaults = dict(
    first_name="John",
    middle_name="A",
    last_name="Doe",
    email="john@example.com",
    phone="+359889123456",
    member_code="CODE001",
    member_code_valid=True,
    proxy=False,
    is_deleted=False,
  )
  defaults.update(kwargs)
  return Member(**defaults)


# ---------------------------------------------------------------------------
# is_valid_file_type
# ---------------------------------------------------------------------------

class TestIsValidFileType:
  def test_accepts_csv(self):
    is_valid_file_type("members.csv")  # should not raise

  def test_rejects_non_csv(self):
    with pytest.raises(InvalidFileTypeError):
      is_valid_file_type("members.xlsx")

  def test_rejects_no_extension(self):
    with pytest.raises(InvalidFileTypeError):
      is_valid_file_type("members")


# ---------------------------------------------------------------------------
# is_member_code_valid
# ---------------------------------------------------------------------------

class TestIsMemberCodeValid:
  def test_returns_member_when_code_valid(self, mock_repo):
    item = {"member_code": "CODE001", "member_code_valid": True, "is_deleted": False}
    mock_repo.table.get_item.return_value = {"Item": item}
    member = make_member()
    mock_repo.convert_item_to_object.return_value = member

    result = is_member_code_valid("CODE001", mock_repo)

    assert result == member
    mock_repo.table.get_item.assert_called_once_with(Key={"member_code": "CODE001"})

  def test_returns_none_when_item_not_found(self, mock_repo):
    mock_repo.table.get_item.return_value = {}

    result = is_member_code_valid("MISSING", mock_repo)

    assert result is None

  def test_returns_none_when_code_invalid(self, mock_repo):
    item = {"member_code": "CODE001", "member_code_valid": False}
    mock_repo.table.get_item.return_value = {"Item": item}

    result = is_member_code_valid("CODE001", mock_repo)

    assert result is None

  def test_returns_none_when_soft_deleted(self, mock_repo):
    item = {"member_code": "CODE001", "member_code_valid": True, "is_deleted": True}
    mock_repo.table.get_item.return_value = {"Item": item}

    result = is_member_code_valid("CODE001", mock_repo)

    assert result is None


# ---------------------------------------------------------------------------
# get_member_by_code
# ---------------------------------------------------------------------------

class TestGetMemberByCode:
  def test_returns_member_when_found(self, mock_repo):
    item = {"member_code": "CODE001"}
    mock_repo.table.get_item.return_value = {"Item": item}
    member = make_member()
    mock_repo.convert_item_to_object.return_value = member

    result = get_member_by_code("CODE001", mock_repo)

    assert result == member

  def test_returns_none_when_item_missing(self, mock_repo):
    mock_repo.table.get_item.return_value = {}

    result = get_member_by_code("MISSING", mock_repo)

    assert result is None

  def test_returns_none_when_soft_deleted(self, mock_repo):
    item = {"member_code": "CODE001"}
    mock_repo.table.get_item.return_value = {"Item": item}
    mock_repo.convert_item_to_object.return_value = make_member(is_deleted=True)

    result = get_member_by_code("CODE001", mock_repo)

    assert result is None


# ---------------------------------------------------------------------------
# update_member_code
# ---------------------------------------------------------------------------

class TestUpdateMemberCode:
  def test_toggles_member_code_valid_to_false(self, mock_repo):
    item = {"member_code": "CODE001", "member_code_valid": True}
    member = make_member(member_code_valid=True)
    mock_repo.table.get_item.return_value = {"Item": item}
    mock_repo.convert_item_to_object.side_effect = [member, make_member(member_code_valid=False)]
    mock_repo.table.update_item.return_value = {"Attributes": {}}

    update_member_code("CODE001", mock_repo)

    call_args = mock_repo.table.update_item.call_args[1]
    assert call_args["ExpressionAttributeValues"][":member_code_valid"] is False

  def test_toggles_member_code_valid_to_true(self, mock_repo):
    item = {"member_code": "CODE001", "member_code_valid": False}
    member = make_member(member_code_valid=False)
    mock_repo.table.get_item.return_value = {"Item": item}
    mock_repo.convert_item_to_object.side_effect = [member, make_member(member_code_valid=True)]
    mock_repo.table.update_item.return_value = {"Attributes": {}}

    update_member_code("CODE001", mock_repo)

    call_args = mock_repo.table.update_item.call_args[1]
    assert call_args["ExpressionAttributeValues"][":member_code_valid"] is True


# ---------------------------------------------------------------------------
# update_member
# ---------------------------------------------------------------------------

class TestUpdateMember:
  @patch("members.operations.get_member_by_code")
  def test_updates_email_successfully(self, mock_get, mock_repo):
    existing = make_member()
    mock_get.return_value = existing
    updated = make_member(email="new@example.com")
    mock_repo.table.update_item.return_value = {"Attributes": {}}
    mock_repo.convert_item_to_object.return_value = updated

    result = update_member("CODE001", MemberUpdate(email="new@example.com"), mock_repo)

    assert result == updated
    call_args = mock_repo.table.update_item.call_args[1]
    assert ":email" in call_args["ExpressionAttributeValues"]

  @patch("members.operations.get_member_by_code")
  def test_updates_phone_successfully(self, mock_get, mock_repo):
    existing = make_member()
    mock_get.return_value = existing
    updated = make_member(phone="+359889000000")
    mock_repo.table.update_item.return_value = {"Attributes": {}}
    mock_repo.convert_item_to_object.return_value = updated

    result = update_member("CODE001", MemberUpdate(phone="0889000000"), mock_repo)

    assert result == updated
    call_args = mock_repo.table.update_item.call_args[1]
    assert ":phone" in call_args["ExpressionAttributeValues"]

  @patch("members.operations.get_member_by_code")
  def test_raises_member_not_found(self, mock_get, mock_repo):
    mock_get.return_value = None

    with pytest.raises(MemberNotFoundError):
      update_member("MISSING", MemberUpdate(email="x@x.com"), mock_repo)

    mock_repo.table.update_item.assert_not_called()

  @patch("members.operations.get_member_by_code")
  def test_raises_validation_error_on_invalid_email(self, mock_get, mock_repo):
    mock_get.return_value = make_member()

    # Patch validate_email to simulate a validation failure after pydantic accepts the field
    with patch("members.operations.validate_email", side_effect=ValueError("Invalid email format")):
      with pytest.raises(ValidationError, match="Invalid email"):
        update_member("CODE001", MemberUpdate(email="user@example.com"), mock_repo)

  @patch("members.operations.get_member_by_code")
  def test_raises_validation_error_on_invalid_phone(self, mock_get, mock_repo):
    mock_get.return_value = make_member()

    with pytest.raises(ValidationError, match="Invalid phone"):
      update_member("CODE001", MemberUpdate(phone="123"), mock_repo)

  @patch("members.operations.get_member_by_code")
  def test_returns_existing_member_when_no_fields_to_update(self, mock_get, mock_repo):
    existing = make_member()
    mock_get.return_value = existing

    result = update_member("CODE001", MemberUpdate(), mock_repo)

    assert result == existing
    mock_repo.table.update_item.assert_not_called()

  @patch("members.operations.get_member_by_code")
  def test_raises_database_error_on_client_error(self, mock_get, mock_repo):
    mock_get.return_value = make_member()
    mock_repo.table.update_item.side_effect = ClientError(
      {"Error": {"Message": "Provisioned throughput exceeded"}}, "update_item"
    )

    with pytest.raises(DatabaseError):
      update_member("CODE001", MemberUpdate(email="new@example.com"), mock_repo)


# ---------------------------------------------------------------------------
# delete_member
# ---------------------------------------------------------------------------

class TestDeleteMember:
  @patch("members.operations.get_member_by_code")
  def test_soft_deletes_member(self, mock_get, mock_repo):
    mock_get.return_value = make_member()
    mock_repo.table.update_item = Mock()

    result = delete_member("CODE001", mock_repo)

    assert result is True
    call_args = mock_repo.table.update_item.call_args[1]
    assert call_args["Key"] == {"member_code": "CODE001"}
    assert call_args["ExpressionAttributeValues"][":is_deleted"] is True

  @patch("members.operations.get_member_by_code")
  def test_raises_member_not_found(self, mock_get, mock_repo):
    mock_get.return_value = None

    with pytest.raises(MemberNotFoundError):
      delete_member("MISSING", mock_repo)

    mock_repo.table.update_item.assert_not_called()

  @patch("members.operations.get_member_by_code")
  def test_raises_database_error_on_client_error(self, mock_get, mock_repo):
    mock_get.return_value = make_member()
    mock_repo.table.update_item.side_effect = ClientError(
      {"Error": {"Message": "Service unavailable"}}, "update_item"
    )

    with pytest.raises(DatabaseError):
      delete_member("CODE001", mock_repo)


# ---------------------------------------------------------------------------
# list_members
# ---------------------------------------------------------------------------

class TestListMembers:
  def _setup_scan(self, mock_repo, items):
    mock_repo.table.scan.return_value = {"Items": items}
    mock_repo.convert_item_to_object.side_effect = [Member(**i) for i in items]

  def test_returns_active_members_sorted(self, mock_repo):
    items = [
      dict(first_name="Zara", middle_name=None, last_name="Smith", email=None, phone=None,
           member_code="C2", member_code_valid=True, proxy=False, is_deleted=False),
      dict(first_name="Anna", middle_name=None, last_name="Jones", email=None, phone=None,
           member_code="C1", member_code_valid=True, proxy=False, is_deleted=False),
    ]
    self._setup_scan(mock_repo, items)

    result = list_members(mock_repo)

    assert len(result) == 2
    assert result[0].first_name == "Anna"
    assert result[1].first_name == "Zara"

  def test_excludes_soft_deleted(self, mock_repo):
    items = [
      dict(first_name="John", middle_name=None, last_name="Doe", email=None, phone=None,
           member_code="C1", member_code_valid=True, proxy=False, is_deleted=False),
      dict(first_name="Jane", middle_name=None, last_name="Doe", email=None, phone=None,
           member_code="C2", member_code_valid=True, proxy=False, is_deleted=True),
    ]
    self._setup_scan(mock_repo, items)

    result = list_members(mock_repo)

    assert len(result) == 1
    assert result[0].member_code == "C1"

  def test_filters_proxy_only(self, mock_repo):
    items = [
      dict(first_name="John", middle_name=None, last_name="Doe", email=None, phone=None,
           member_code="C1", member_code_valid=True, proxy=True, is_deleted=False),
      dict(first_name="Jane", middle_name=None, last_name="Doe", email=None, phone=None,
           member_code="C2", member_code_valid=True, proxy=False, is_deleted=False),
    ]
    self._setup_scan(mock_repo, items)

    result = list_members(mock_repo, proxy_only=True)

    assert len(result) == 1
    assert result[0].member_code == "C1"

  def test_raises_database_error_on_client_error(self, mock_repo):
    mock_repo.table.scan.side_effect = ClientError(
      {"Error": {"Message": "Internal server error"}}, "scan"
    )

    with pytest.raises(DatabaseError):
      list_members(mock_repo)

  def test_handles_paginated_scan(self, mock_repo):
    page1 = dict(first_name="Anna", middle_name=None, last_name="A", email=None, phone=None,
                 member_code="C1", member_code_valid=True, proxy=False, is_deleted=False)
    page2 = dict(first_name="Bob", middle_name=None, last_name="B", email=None, phone=None,
                 member_code="C2", member_code_valid=True, proxy=False, is_deleted=False)

    mock_repo.table.scan.side_effect = [
      {"Items": [page1], "LastEvaluatedKey": {"member_code": "C1"}},
      {"Items": [page2]},
    ]
    mock_repo.convert_item_to_object.side_effect = [Member(**page1), Member(**page2)]

    result = list_members(mock_repo)

    assert len(result) == 2
    assert mock_repo.table.scan.call_count == 2


# ---------------------------------------------------------------------------
# sync_members_list
# ---------------------------------------------------------------------------

class TestSyncMembersList:
  def _make_raw(self, **kwargs):
    defaults = dict(
      first_name="john", middle_name="a", last_name="doe",
      phone="0889123456", email="john@example.com",
      member_code="CODE001", proxy="no", board="no", control="no",
    )
    defaults.update(kwargs)
    return defaults

  def test_adds_new_members(self, mock_repo):
    mock_repo.table.scan.return_value = {"Items": []}
    batch_mock = MagicMock()
    mock_repo.table.batch_writer.return_value.__enter__ = Mock(return_value=batch_mock)
    mock_repo.table.batch_writer.return_value.__exit__ = Mock(return_value=False)

    sync_members_list([self._make_raw()], mock_repo)

    batch_mock.put_item.assert_called_once()
    written = batch_mock.put_item.call_args[1]["Item"]
    assert written["member_code"] == "CODE001"
    assert written["is_deleted"] is False

  def test_soft_deletes_absent_members(self, mock_repo):
    existing = dict(
      first_name="Old", middle_name="M", last_name="Member", email=None, phone=None,
      member_code="OLD001", member_code_valid=True, proxy=False, is_deleted=False,
    )
    mock_repo.table.scan.return_value = {"Items": [existing]}
    batch_mock = MagicMock()
    mock_repo.table.batch_writer.return_value.__enter__ = Mock(return_value=batch_mock)
    mock_repo.table.batch_writer.return_value.__exit__ = Mock(return_value=False)

    # Upload list does NOT contain OLD001
    sync_members_list([self._make_raw(member_code="NEW001")], mock_repo)

    put_calls = batch_mock.put_item.call_args_list
    items = [c[1]["Item"] for c in put_calls]
    old_item = next(i for i in items if i["member_code"] == "OLD001")
    assert old_item["is_deleted"] is True

  def test_restores_soft_deleted_member(self, mock_repo):
    existing = dict(
      first_name="Old", middle_name="M", last_name="Member", email=None, phone=None,
      member_code="CODE001", member_code_valid=True, proxy=False, is_deleted=True,
    )
    mock_repo.table.scan.return_value = {"Items": [existing]}
    batch_mock = MagicMock()
    mock_repo.table.batch_writer.return_value.__enter__ = Mock(return_value=batch_mock)
    mock_repo.table.batch_writer.return_value.__exit__ = Mock(return_value=False)

    sync_members_list([self._make_raw(member_code="CODE001")], mock_repo)

    items = [c[1]["Item"] for c in batch_mock.put_item.call_args_list]
    restored = next(i for i in items if i["member_code"] == "CODE001")
    assert restored["is_deleted"] is False

  def test_skips_already_deleted_absent_members(self, mock_repo):
    existing = dict(
      first_name="Old", middle_name="M", last_name="Member", email=None, phone=None,
      member_code="OLD001", member_code_valid=True, proxy=False, is_deleted=True,
    )
    mock_repo.table.scan.return_value = {"Items": [existing]}
    batch_mock = MagicMock()
    mock_repo.table.batch_writer.return_value.__enter__ = Mock(return_value=batch_mock)
    mock_repo.table.batch_writer.return_value.__exit__ = Mock(return_value=False)

    # Upload list does NOT contain OLD001 (already deleted)
    sync_members_list([self._make_raw(member_code="NEW001")], mock_repo)

    items = [c[1]["Item"] for c in batch_mock.put_item.call_args_list]
    old_items = [i for i in items if i["member_code"] == "OLD001"]
    assert old_items == []


# ---------------------------------------------------------------------------
# _normalize_members
# ---------------------------------------------------------------------------

class TestNormalizeMembers:
  def _raw(self, **kwargs):
    defaults = dict(
      first_name="john", middle_name="a", last_name="doe",
      phone="0889123456", email="john@example.com",
      member_code="CODE001", proxy="no", board="no", control="no",
    )
    defaults.update(kwargs)
    return defaults

  def test_capitalizes_names(self):
    result = _normalize_members([self._raw()])
    assert result[0]["first_name"] == "John"
    assert result[0]["last_name"] == "Doe"

  def test_converts_phone_to_international(self):
    result = _normalize_members([self._raw(phone="0889123456")])
    assert result[0]["phone"] == "+359889123456"

  def test_sets_phone_to_none_on_invalid(self):
    result = _normalize_members([self._raw(phone="123")])
    assert result[0]["phone"] is None

  def test_sets_email_to_none_on_invalid(self):
    result = _normalize_members([self._raw(email="not-valid")])
    assert result[0]["email"] is None

  def test_handles_empty_phone(self):
    result = _normalize_members([self._raw(phone="")])
    assert result[0]["phone"] is None

  def test_handles_empty_email(self):
    result = _normalize_members([self._raw(email="")])
    assert result[0]["email"] is None

  def test_parses_proxy_truthy_values(self):
    for val in ["1", "yes", "true", "YES", "True"]:
      result = _normalize_members([self._raw(proxy=val)])
      assert result[0]["proxy"] is True, f"Expected proxy=True for {val!r}"

  def test_parses_proxy_falsy_values(self):
    for val in ["0", "no", "false"]:
      result = _normalize_members([self._raw(proxy=val)])
      assert result[0]["proxy"] is False

  def test_new_member_is_not_deleted(self):
    result = _normalize_members([self._raw()])
    assert result[0]["is_deleted"] is False

  def test_new_member_code_is_valid(self):
    result = _normalize_members([self._raw()])
    assert result[0]["member_code_valid"] is True


# ---------------------------------------------------------------------------
# convert_members_list
# ---------------------------------------------------------------------------

class TestConvertMembersList:
  def test_parses_csv_file(self):
    csv_content = b"first_name,last_name,member_code\nJohn,Doe,CODE001\n"
    mock_file = AsyncMock()
    mock_file.read.return_value = csv_content

    result = asyncio.run(convert_members_list(mock_file))

    assert len(result) == 1
    assert result[0]["first_name"] == "John"
    assert result[0]["member_code"] == "CODE001"

  def test_parses_csv_with_bom(self):
    csv_content = b"\xef\xbb\xbffirst_name,last_name,member_code\nJane,Doe,CODE002\n"
    mock_file = AsyncMock()
    mock_file.read.return_value = csv_content

    result = asyncio.run(convert_members_list(mock_file))

    assert result[0]["first_name"] == "Jane"

  def test_parses_multiple_rows(self):
    csv_content = b"first_name,last_name,member_code\nJohn,Doe,C1\nJane,Smith,C2\n"
    mock_file = AsyncMock()
    mock_file.read.return_value = csv_content

    result = asyncio.run(convert_members_list(mock_file))

    assert len(result) == 2


# ---------------------------------------------------------------------------
# members_list_to_csv
# ---------------------------------------------------------------------------

class TestMembersListToCsv:
  def test_returns_bytes_io(self, mock_repo):
    mock_repo.table.scan.return_value = {"Items": []}

    result = members_list_to_csv(mock_repo)

    assert isinstance(result, io.BytesIO)

  def test_csv_starts_with_bom(self, mock_repo):
    mock_repo.table.scan.return_value = {"Items": []}

    result = members_list_to_csv(mock_repo)

    assert result.read(3) == b"\xef\xbb\xbf"

  def test_csv_includes_member_data(self, mock_repo):
    items = [
      dict(member_code="CODE001", first_name="John", middle_name="A", last_name="Doe",
           email="john@example.com", phone="+359889123456", proxy=False, board=False, control=False)
    ]
    mock_repo.table.scan.return_value = {"Items": items}

    result = members_list_to_csv(mock_repo)
    content = result.read().decode("utf-8-sig")

    assert "CODE001" in content
    assert "John" in content
    # Phone should be converted back from +359 to 0
    assert "0889123456" in content

  def test_csv_has_correct_headers(self, mock_repo):
    mock_repo.table.scan.return_value = {"Items": []}

    result = members_list_to_csv(mock_repo)
    header_line = result.read().decode("utf-8-sig").splitlines()[0]

    for field in ["member_code", "first_name", "last_name", "email", "phone", "proxy", "board", "control"]:
      assert field in header_line
