from unittest.mock import MagicMock, Mock, patch

import pytest

from database.exceptions import DatabaseError
from products.exceptions import ProductNotFoundError
from products.models import Product, ProductSize, ProductUpdate
from products.operations import (
  create_product,
  delete_product,
  get_product,
  list_orphaned_pictures,
  list_products,
  parse_sizes,
  update_product,
)


@pytest.fixture
def mock_repo():
  repo = Mock()
  repo.table = Mock()
  repo.convert_item_to_object = Mock(side_effect=lambda item: Product(**{
    k: v for k, v in item.items() if k in Product.model_fields
  }))
  return repo


class TestParseSizes:
  def test_parses_valid_json(self):
    result = parse_sizes('[{"label": "Малък", "value": "10x5 cm"}]')
    assert len(result) == 1
    assert result[0].label == "Малък"
    assert result[0].value == "10x5 cm"

  def test_empty_string_returns_empty_list(self):
    assert parse_sizes("") == []

  def test_empty_array_returns_empty_list(self):
    assert parse_sizes("[]") == []

  def test_invalid_json_raises_value_error(self):
    with pytest.raises(ValueError, match="Invalid sizes format"):
      parse_sizes("not-json")

  def test_non_array_raises_value_error(self):
    with pytest.raises(ValueError, match="Invalid sizes format"):
      parse_sizes('{"label": "x"}')


class TestGetProduct:
  def test_returns_product_when_found(self, mock_repo):
    mock_repo.table.get_item = Mock(return_value={"Item": {
      "id": "abc", "name": "Product A", "sizes": [], "description": None, "picture_s3_key": None
    }})

    result = get_product(mock_repo, "abc")
    assert result.id == "abc"
    assert result.name == "Product A"

  def test_raises_not_found_when_missing(self, mock_repo):
    mock_repo.table.get_item = Mock(return_value={})

    with pytest.raises(ProductNotFoundError):
      get_product(mock_repo, "missing")


class TestCreateProduct:
  @patch("products.operations.boto3.client")
  def test_creates_product_without_picture(self, mock_boto, mock_repo):
    mock_repo.table.put_item = Mock()
    mock_repo.convert_item_to_object = Mock(return_value=Mock(picture_s3_key=None))

    result = create_product("Product A", "Description", [], None, mock_repo)

    assert result is not None
    mock_repo.table.put_item.assert_called_once()
    call_item = mock_repo.table.put_item.call_args[1]["Item"]
    assert call_item["name"] == "Product A"
    assert call_item["description"] == "Description"
    assert call_item["sizes"] == []
    assert call_item["picture_s3_key"] is None
    assert "id" in call_item

  @patch("products.operations.boto3.client")
  def test_creates_product_with_sizes(self, mock_boto, mock_repo):
    mock_repo.table.put_item = Mock()
    mock_repo.convert_item_to_object = Mock(return_value=Mock(picture_s3_key=None))
    sizes = [ProductSize(label="Малък", value="10x5 cm")]

    create_product("Product B", None, sizes, None, mock_repo)

    call_item = mock_repo.table.put_item.call_args[1]["Item"]
    assert call_item["sizes"] == [{"label": "Малък", "value": "10x5 cm"}]

  @patch("products.operations.boto3.client")
  def test_raises_database_error_on_dynamo_failure(self, mock_boto, mock_repo):
    from botocore.exceptions import ClientError

    mock_repo.table.put_item.side_effect = ClientError({"Error": {"Message": "fail"}}, "put_item")

    with pytest.raises(DatabaseError):
      create_product("Product C", None, [], None, mock_repo)


class TestDeleteProduct:
  @patch("products.operations.delete_product_picture")
  def test_deletes_product_and_picture(self, mock_delete_pic, mock_repo):
    product = Product(id="abc", name="X", picture_s3_key="products/abc.jpg")
    mock_repo.table.delete_item = Mock()

    delete_product(product, mock_repo)

    mock_delete_pic.assert_called_once_with("products/abc.jpg")
    mock_repo.table.delete_item.assert_called_once_with(Key={"id": "abc"})

  @patch("products.operations.delete_product_picture")
  def test_deletes_product_without_picture(self, mock_delete_pic, mock_repo):
    product = Product(id="abc", name="X")
    mock_repo.table.delete_item = Mock()

    delete_product(product, mock_repo)

    mock_delete_pic.assert_not_called()
    mock_repo.table.delete_item.assert_called_once()


class TestListProducts:
  @patch("products.operations._get_products_from_db")
  def test_returns_all_products(self, mock_get_db, mock_repo):
    mock_get_db.return_value = [
      {"id": "1", "name": "A", "sizes": [], "description": None, "picture_s3_key": None},
      {"id": "2", "name": "B", "sizes": [], "description": None, "picture_s3_key": None},
    ]

    result = list_products(mock_repo)
    assert len(result) == 2

  @patch("products.operations._get_products_from_db")
  def test_raises_database_error_on_client_error(self, mock_get_db, mock_repo):
    from botocore.exceptions import ClientError
    mock_get_db.side_effect = ClientError({"Error": {"Message": "fail"}}, "Scan")

    with pytest.raises(DatabaseError):
      list_products(mock_repo)


class TestListOrphanedPictures:
  @patch("products.operations.boto3.client")
  @patch("products.operations._get_products_from_db")
  def test_returns_unreferenced_keys(self, mock_get_db, mock_boto, mock_repo):
    mock_get_db.return_value = [
      {"id": "1", "name": "A", "picture_s3_key": "products/used.jpg"},
    ]

    mock_s3 = MagicMock()
    mock_boto.return_value = mock_s3
    paginator = MagicMock()
    mock_s3.get_paginator.return_value = paginator
    paginator.paginate.return_value = [
      {"Contents": [{"Key": "products/used.jpg"}, {"Key": "products/orphan.jpg"}]}
    ]

    result = list_orphaned_pictures(mock_repo)

    assert result == ["products/orphan.jpg"]

  @patch("products.operations.boto3.client")
  @patch("products.operations._get_products_from_db")
  def test_returns_empty_when_no_orphans(self, mock_get_db, mock_boto, mock_repo):
    mock_get_db.return_value = [
      {"id": "1", "name": "A", "picture_s3_key": "products/used.jpg"},
    ]

    mock_s3 = MagicMock()
    mock_boto.return_value = mock_s3
    paginator = MagicMock()
    mock_s3.get_paginator.return_value = paginator
    paginator.paginate.return_value = [
      {"Contents": [{"Key": "products/used.jpg"}]}
    ]

    result = list_orphaned_pictures(mock_repo)
    assert result == []
