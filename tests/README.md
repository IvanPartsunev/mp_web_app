# Tests

Test suite for the MP Web Site platform.

---

## Structure

```
tests/
└── backend/                    # Backend test modules
    ├── conftest.py            # Shared fixtures and configuration
    ├── test_auth_operations.py    # Authentication tests
    ├── test_users_operations.py   # User management tests
    ├── test_files_operations.py   # File upload/download tests
    ├── test_news_operations.py    # News CRUD tests
    └── test_example.py           # Example/placeholder test
```

---

## Backend Tests

### Framework

- **pytest** 8.3.4 with verbose output and strict markers
- **pytest-cov** for coverage reporting
- **pytest-mock** for mocking AWS services
- **httpx** for async HTTP testing

### Test Categories

| Marker | Description |
|--------|-------------|
| `@pytest.mark.unit` | Unit tests (isolated, mocked dependencies) |
| `@pytest.mark.integration` | Integration tests (may require DynamoDB local) |

### Coverage

| Module | Test File | Areas Covered |
|--------|-----------|---------------|
| Authentication | `test_auth_operations.py` | JWT generation, token refresh, login/logout, password verification |
| Users | `test_users_operations.py` | User CRUD, validation (password, phone, email), role management |
| Files | `test_files_operations.py` | File upload, download, access control, metadata |
| News | `test_news_operations.py` | News CRUD, type filtering, subscriber notifications |

---

## Running Tests

### From Project Root (Makefile)

```bash
make backend-test         # Run all backend tests
make backend-test-cov     # Run with HTML coverage report
```

### Direct pytest

```bash
cd mp_web_app/backend

uv run pytest                              # All tests
uv run pytest tests/test_auth_operations.py # Specific file
uv run pytest -m unit                      # By marker
uv run pytest -m integration               # Integration only
uv run pytest -v                           # Verbose
uv run pytest --cov=. --cov-report=html    # With coverage
```

---

## Configuration

From `pyproject.toml`:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
markers = ["unit: Unit tests", "integration: Integration tests"]
addopts = "-v --tb=short --strict-markers"
```

---

## Local Test Environment

For integration tests requiring DynamoDB:

```bash
docker-compose up -d    # Start local DynamoDB on port 8005
make backend-test       # Run tests
```

---

## Frontend Tests

No dedicated frontend test suite exists yet. Recommended additions:
- **Vitest** for unit tests (hooks, utilities)
- **React Testing Library** for component tests
- **Playwright** for end-to-end tests
