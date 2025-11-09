"""
Pytest configuration and shared fixtures.
"""
import os
from unittest.mock import MagicMock, Mock, patch

import pytest


def pytest_configure(config):
    """Configure pytest before any tests run."""
    # Set environment variables BEFORE any imports
    os.environ["USERS_TABLE_NAME"] = "test_users_table"
    os.environ["MEMBERS_TABLE_NAME"] = "test_codes_table"
    os.environ["REFRESH_TABLE_NAME"] = "test_refresh_table"
    os.environ["UPLOADS_TABLE_NAME"] = "test_uploads_table"
    os.environ["NEWS_TABLE_NAME"] = "test_news_table"
    os.environ["GALLERY_TABLE_NAME"] = "test_gallery_table"
    os.environ["UPLOADS_BUCKET"] = "test-bucket"
    os.environ["FRONTEND_BASE_URL"] = "http://localhost:3000"
    os.environ["COOKIE_DOMAIN"] = "localhost"
    os.environ["MAIL_SENDER"] = "test@example.com"
    os.environ["JWT_ALGORITHM"] = "HS256"
    os.environ["JWT_SECRET_ARN"] = "arn:aws:secretsmanager:test:secret"
    # AWS credentials for DynamoDB
    os.environ["AWS_ACCESS_KEY_ID"] = "test_access_key"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "test_secret_key"

    # Mock boto3 before any imports
    mock_sm = MagicMock()
    mock_sm.get_secret_value.return_value = {
        'SecretString': '{"JWT_SECRET": "test_secret_key_for_testing"}'
    }

    mock_dynamodb = MagicMock()

    def mock_boto3_client(service_name, **kwargs):
        if service_name == 'secretsmanager':
            return mock_sm
        return MagicMock()

    def mock_boto3_resource(service_name, **kwargs):
        return mock_dynamodb

    # Patch boto3 globally
    patcher_client = patch('boto3.client', side_effect=mock_boto3_client)
    patcher_resource = patch('boto3.resource', side_effect=mock_boto3_resource)
    patcher_client.start()
    patcher_resource.start()


@pytest.fixture(scope="function")
def mock_repo():
    """Create a mock repository for tests."""
    repo = Mock()
    repo.table = Mock()
    repo.convert_item_to_object = Mock()
    return repo
