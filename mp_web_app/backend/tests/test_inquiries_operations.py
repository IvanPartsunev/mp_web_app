from unittest.mock import Mock, patch

import pytest

from inquiries.exceptions import InquiryAccessDeniedError, InquiryNotFoundError, InquiryStatusError
from inquiries.models import (
  AssignEntryNumber,
  CloseInquiry,
  Inquiry,
  InquiryCreate,
  InquiryStatus,
  InquiryUpdate,
)
from inquiries.operations import (
  _sort_inquiries,
  assign_entry_number,
  close_inquiry,
  create_inquiry,
  delete_inquiry,
  get_inquiry,
  list_inquiries_for_scope,
  list_inquiries_for_user,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _make_inquiry(**kwargs) -> Inquiry:
  defaults = {
    "id": "inq-1",
    "title": "Test inquiry",
    "description": "Some description",
    "inquiry_type": "запитване",
    "scope": ["admin"],
    "author_id": "user-1",
    "author_name": "Иван Иванов",
    "co_authors": [],
    "co_author_names": [],
    "status": InquiryStatus.SENT,
    "entry_number": None,
    "file_s3_keys": [],
    "closing_record": None,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00",
  }
  defaults.update(kwargs)
  return Inquiry(**defaults)


@pytest.fixture
def mock_repo():
  repo = Mock()
  repo.table = Mock()
  repo.convert_item_to_object = Mock(
    side_effect=lambda item: Inquiry(**{k: v for k, v in item.items() if k in Inquiry.model_fields})
  )
  return repo


@pytest.fixture
def mock_user_repo():
  repo = Mock()
  repo.table = Mock()
  repo.table.get_item = Mock(
    return_value={
      "Item": {
        "id": "user-1",
        "first_name": "Иван",
        "last_name": "Иванов",
        "email": "ivan@example.com",
        "role": "regular",
        "phone": None,
        "active": True,
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "subscribed": True,
      }
    }
  )

  from users.models import User

  repo.convert_item_to_object = Mock(
    return_value=User(
      id="user-1",
      first_name="Иван",
      last_name="Иванов",
      email="ivan@example.com",
      role="regular",
      phone=None,
      active=True,
      created_at="2024-01-01T00:00:00",
      updated_at="2024-01-01T00:00:00",
      subscribed=True,
    )
  )
  return repo


# ---------------------------------------------------------------------------
# get_inquiry
# ---------------------------------------------------------------------------


class TestGetInquiry:
  def test_returns_inquiry_when_found(self, mock_repo):
    inq = _make_inquiry()
    mock_repo.table.get_item = Mock(return_value={"Item": inq.model_dump()})
    mock_repo.convert_item_to_object = Mock(return_value=inq)

    result = get_inquiry("inq-1", mock_repo)
    assert result.id == "inq-1"

  def test_raises_not_found_when_missing(self, mock_repo):
    mock_repo.table.get_item = Mock(return_value={})

    with pytest.raises(InquiryNotFoundError):
      get_inquiry("missing", mock_repo)


# ---------------------------------------------------------------------------
# create_inquiry
# ---------------------------------------------------------------------------


class TestCreateInquiry:
  @patch("inquiries.operations.boto3.client")
  def test_creates_inquiry_no_files(self, mock_boto, mock_repo, mock_user_repo):
    mock_repo.table.put_item = Mock()
    created_inquiry = _make_inquiry()
    mock_repo.convert_item_to_object = Mock(return_value=created_inquiry)

    data = InquiryCreate(
      title="Test",
      description="Desc",
      inquiry_type="запитване",
      scope=["admin"],
      co_authors=[],
    )
    result = create_inquiry(data, [], "user-1", mock_repo, mock_user_repo)

    assert result is not None
    mock_repo.table.put_item.assert_called_once()
    item = mock_repo.table.put_item.call_args[1]["Item"]
    assert item["title"] == "Test"
    assert item["status"] == InquiryStatus.SENT
    assert "admin" in item["scope"]
    assert "id" in item

  @patch("inquiries.operations.boto3.client")
  def test_admin_always_in_scope(self, mock_boto, mock_repo, mock_user_repo):
    mock_repo.table.put_item = Mock()
    mock_repo.convert_item_to_object = Mock(return_value=_make_inquiry())

    data = InquiryCreate(
      title="Test",
      description="Desc",
      inquiry_type="молба",
      scope=["board"],  # admin NOT explicitly included
      co_authors=[],
    )
    create_inquiry(data, [], "user-1", mock_repo, mock_user_repo)

    item = mock_repo.table.put_item.call_args[1]["Item"]
    assert "admin" in item["scope"]
    assert "board" in item["scope"]

  def test_raises_on_empty_title(self, mock_repo, mock_user_repo):
    data = InquiryCreate(
      title="   ",
      description="Desc",
      inquiry_type="запитване",
      scope=["admin"],
    )
    with pytest.raises(ValueError, match="Title is required"):
      create_inquiry(data, [], "user-1", mock_repo, mock_user_repo)

  def test_raises_on_empty_description(self, mock_repo, mock_user_repo):
    data = InquiryCreate(
      title="Title",
      description="   ",
      inquiry_type="запитване",
      scope=["admin"],
    )
    with pytest.raises(ValueError, match="Description is required"):
      create_inquiry(data, [], "user-1", mock_repo, mock_user_repo)

  @patch("inquiries.operations.boto3.client")
  def test_raises_when_files_exceed_5mb(self, mock_boto, mock_repo, mock_user_repo):
    big_file = Mock()
    big_file.filename = "big.pdf"
    big_file.file = Mock()
    big_file.file.tell = Mock(return_value=6 * 1024 * 1024)  # 6 MB

    data = InquiryCreate(title="T", description="D", inquiry_type="сигнал", scope=["admin"])
    with pytest.raises(ValueError, match="5 MB"):
      create_inquiry(data, [big_file], "user-1", mock_repo, mock_user_repo)


# ---------------------------------------------------------------------------
# update_inquiry — status guards
# ---------------------------------------------------------------------------


class TestUpdateInquiry:
  def test_allows_title_update_when_sent(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(status=InquiryStatus.SENT)
    mock_repo.table.update_item = Mock(return_value={"Attributes": inq.model_dump()})
    mock_repo.convert_item_to_object = Mock(return_value=inq)

    data = InquiryUpdate(title="New title")
    result = update_inquiry(inq, data, [], mock_repo, mock_user_repo)
    assert result is not None

  def test_rejects_title_update_when_accepted(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(status=InquiryStatus.IN_PROGRESS)
    data = InquiryUpdate(title="New title")

    with pytest.raises(InquiryStatusError):
      update_inquiry(inq, data, [], mock_repo, mock_user_repo)

  def test_rejects_description_update_when_in_progress(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(status=InquiryStatus.IN_PROGRESS)
    data = InquiryUpdate(description="Changed")

    with pytest.raises(InquiryStatusError):
      update_inquiry(inq, data, [], mock_repo, mock_user_repo)

  def test_allows_scope_update_after_acceptance(self, mock_repo, mock_user_repo):
    """Scope and co_authors can still be changed even after acceptance."""
    inq = _make_inquiry(status=InquiryStatus.IN_PROGRESS)
    mock_repo.table.update_item = Mock(return_value={"Attributes": inq.model_dump()})
    mock_repo.convert_item_to_object = Mock(return_value=inq)

    data = InquiryUpdate(scope=["admin", "board"])
    result = update_inquiry(inq, data, [], mock_repo, mock_user_repo)
    assert result is not None


# ---------------------------------------------------------------------------
# assign_entry_number
# ---------------------------------------------------------------------------


class TestAssignEntryNumber:
  def test_assigns_entry_number_and_sets_in_progress(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(status=InquiryStatus.SENT)
    updated_inq = _make_inquiry(status=InquiryStatus.IN_PROGRESS, entry_number="42")
    mock_repo.table.update_item = Mock(return_value={"Attributes": updated_inq.model_dump()})
    mock_repo.convert_item_to_object = Mock(return_value=updated_inq)

    with patch("inquiries.operations._notify_author_status_change"):
      result = assign_entry_number(inq, AssignEntryNumber(entry_number="42"), mock_repo, mock_user_repo)

    assert result.status == InquiryStatus.IN_PROGRESS
    assert result.entry_number == "42"

  def test_raises_when_not_sent(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(status=InquiryStatus.IN_PROGRESS, entry_number="10")

    with pytest.raises(InquiryStatusError, match="sent"):
      assign_entry_number(inq, AssignEntryNumber(entry_number="99"), mock_repo, mock_user_repo)


# ---------------------------------------------------------------------------
# close_inquiry
# ---------------------------------------------------------------------------


class TestCloseInquiry:
  def test_author_can_close(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(status=InquiryStatus.IN_PROGRESS, entry_number="5")
    closed_inq = _make_inquiry(status=InquiryStatus.CLOSED, entry_number="5")
    mock_repo.table.update_item = Mock(return_value={"Attributes": closed_inq.model_dump()})
    mock_repo.convert_item_to_object = Mock(return_value=closed_inq)

    with patch("inquiries.operations._notify_author_status_change"):
      result = close_inquiry(
        inq,
        CloseInquiry(final_status="closed", reason="Done"),
        None,
        "user-1",  # author
        "regular",
        mock_repo,
        mock_user_repo,
      )
    assert result.status == InquiryStatus.CLOSED

  def test_non_involved_user_cannot_close(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(status=InquiryStatus.IN_PROGRESS, author_id="user-1", co_authors=[], scope=["admin"])

    with pytest.raises(InquiryAccessDeniedError):
      close_inquiry(
        inq,
        CloseInquiry(final_status="closed", reason="Done"),
        None,
        "outsider-99",
        "regular",
        mock_repo,
        mock_user_repo,
      )

  def test_admin_can_close_any_inquiry(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(status=InquiryStatus.SENT, author_id="user-1")
    closed_inq = _make_inquiry(status=InquiryStatus.FINISHED)
    mock_repo.table.update_item = Mock(return_value={"Attributes": closed_inq.model_dump()})
    mock_repo.convert_item_to_object = Mock(return_value=closed_inq)

    with patch("inquiries.operations._notify_author_status_change"):
      result = close_inquiry(
        inq,
        CloseInquiry(final_status="finished", reason="Resolved"),
        None,
        "admin-1",
        "admin",
        mock_repo,
        mock_user_repo,
      )
    assert result.status == InquiryStatus.FINISHED

  def test_empty_reason_raises(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(author_id="user-1")

    with pytest.raises(ValueError, match="reason"):
      close_inquiry(
        inq,
        CloseInquiry(final_status="closed", reason="   "),
        None,
        "user-1",
        "regular",
        mock_repo,
        mock_user_repo,
      )

  def test_invalid_final_status_raises(self, mock_repo, mock_user_repo):
    inq = _make_inquiry(author_id="user-1")

    with pytest.raises(InquiryStatusError):
      close_inquiry(
        inq,
        CloseInquiry(final_status="in_progress", reason="Trying to reopen"),
        None,
        "user-1",
        "regular",
        mock_repo,
        mock_user_repo,
      )


# ---------------------------------------------------------------------------
# delete_inquiry
# ---------------------------------------------------------------------------


class TestDeleteInquiry:
  @patch("inquiries.operations._delete_inquiry_folder")
  def test_author_can_delete(self, mock_delete_folder, mock_repo):
    inq = _make_inquiry(author_id="user-1")
    mock_repo.table.delete_item = Mock()

    delete_inquiry(inq, "user-1", "regular", mock_repo)

    mock_delete_folder.assert_called_once_with("inq-1")
    mock_repo.table.delete_item.assert_called_once_with(Key={"id": "inq-1"})

  @patch("inquiries.operations._delete_inquiry_folder")
  def test_admin_can_delete_any(self, mock_delete_folder, mock_repo):
    inq = _make_inquiry(author_id="user-1")
    mock_repo.table.delete_item = Mock()

    delete_inquiry(inq, "admin-1", "admin", mock_repo)

    mock_repo.table.delete_item.assert_called_once()

  @patch("inquiries.operations._delete_inquiry_folder")
  def test_non_author_cannot_delete(self, mock_delete_folder, mock_repo):
    inq = _make_inquiry(author_id="user-1")

    with pytest.raises(InquiryAccessDeniedError):
      delete_inquiry(inq, "outsider-99", "regular", mock_repo)


# ---------------------------------------------------------------------------
# listing / visibility filtering
# ---------------------------------------------------------------------------


class TestListingFilters:
  @patch("inquiries.operations._full_scan")
  @patch("inquiries.operations._enrich_inquiry")
  def test_list_for_user_returns_authored(self, mock_enrich, mock_scan, mock_repo, mock_user_repo):
    inq1 = _make_inquiry(id="i1", author_id="user-1")
    inq2 = _make_inquiry(id="i2", author_id="user-2")
    mock_scan.return_value = [inq1, inq2]

    result = list_inquiries_for_user("user-1", mock_repo, mock_user_repo)
    assert all(i.id == "i1" for i in result)

  @patch("inquiries.operations._full_scan")
  @patch("inquiries.operations._enrich_inquiry")
  def test_list_for_user_includes_co_authors(self, mock_enrich, mock_scan, mock_repo, mock_user_repo):
    inq1 = _make_inquiry(id="i1", author_id="user-2", co_authors=["user-1"])
    inq2 = _make_inquiry(id="i2", author_id="user-3", co_authors=[])
    mock_scan.return_value = [inq1, inq2]

    result = list_inquiries_for_user("user-1", mock_repo, mock_user_repo)
    assert len(result) == 1
    assert result[0].id == "i1"

  @patch("inquiries.operations._full_scan")
  @patch("inquiries.operations._enrich_inquiry")
  def test_list_for_scope_filters_by_role(self, mock_enrich, mock_scan, mock_repo, mock_user_repo):
    inq1 = _make_inquiry(id="i1", scope=["admin", "board"])
    inq2 = _make_inquiry(id="i2", scope=["admin"])
    mock_scan.return_value = [inq1, inq2]

    result = list_inquiries_for_scope("board", mock_repo, mock_user_repo)
    assert len(result) == 1
    assert result[0].id == "i1"


# ---------------------------------------------------------------------------
# sorting
# ---------------------------------------------------------------------------


class TestSortInquiries:
  def test_null_entry_number_comes_first(self):
    inq_no_num = _make_inquiry(id="a", entry_number=None)
    inq_with_num = _make_inquiry(id="b", entry_number="5")

    result = _sort_inquiries([inq_with_num, inq_no_num])
    assert result[0].id == "a"

  def test_higher_entry_number_comes_first(self):
    inq_low = _make_inquiry(id="low", entry_number="2")
    inq_high = _make_inquiry(id="high", entry_number="10")

    result = _sort_inquiries([inq_low, inq_high])
    assert result[0].id == "high"

  def test_mixed_sorting(self):
    inqs = [
      _make_inquiry(id="n5", entry_number="5"),
      _make_inquiry(id="n1", entry_number="1"),
      _make_inquiry(id="none", entry_number=None),
      _make_inquiry(id="n10", entry_number="10"),
    ]
    result = _sort_inquiries(inqs)
    assert result[0].id == "none"
    assert result[1].id == "n10"
    assert result[2].id == "n5"
    assert result[3].id == "n1"
