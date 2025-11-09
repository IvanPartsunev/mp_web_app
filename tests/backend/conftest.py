import os
import pytest
from users.operations import get_user_repository
from auth.operations import get_auth_repository

# ✅ Provide dummy env vars so imports don’t fail
os.environ.setdefault("JWT_SECRET_ARN", "dummy-secret-arn")
os.environ.setdefault("REFRESH_TABLE_NAME", "dummy-refresh-table")
os.environ.setdefault("USERS_TABLE_NAME", "dummy-users-table")
os.environ.setdefault("MEMBERS_TABLE_NAME", "dummy-member-table")


@pytest.fixture
def user_repo():
    # real repo object, but with in-memory table mock
    class FakeTable:
        def __init__(self):
            self.items = {}

        def put_item(self, Item):
            self.items[Item["id"]] = Item

        def get_item(self, Key):
            return {"Item": self.items.get(Key["id"])} if Key["id"] in self.items else {}

        def query(self, **kwargs):
            for item in self.items.values():
                if item["email"] == kwargs["KeyConditionExpression"].values[0]:
                    return {"Items": [item]}
            return {"Items": []}

    repo = get_user_repository()
    repo.table = FakeTable()
    return repo


@pytest.fixture
def auth_repo():
    class FakeTable:
        def __init__(self):
            self.items = {}

        def put_item(self, Item):
            self.items[Item["id"]] = Item

        def get_item(self, Key):
            return {"Item": self.items.get(Key["id"])} if Key["id"] in self.items else {}

        def update_item(self, **kwargs):
            self.items[kwargs["Key"]["id"]]["valid"] = kwargs["ExpressionAttributeValues"][":v"]
            return {"Attributes": self.items[kwargs["Key"]["id"]]}

    repo = get_auth_repository()
    repo.table = FakeTable()
    return repo
