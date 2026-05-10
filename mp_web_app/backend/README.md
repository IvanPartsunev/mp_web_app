# Backend - FastAPI REST API

The backend is a **FastAPI** application (Python 3.12) that serves as the REST API for the platform. It runs on AWS Lambda via the **Mangum** ASGI adapter and uses **DynamoDB** for data storage and **S3** for file storage.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.115.6 | Web framework with auto OpenAPI docs |
| Pydantic v2 | 2.10.6 | Data validation & serialization |
| Uvicorn | 0.34.2 | ASGI server (local development) |
| Mangum | 0.19.0 | AWS Lambda ASGI adapter |
| python-jose | 3.4.0 | JWT token operations |
| argon2-cffi | 23.1.0 | Password hashing |
| boto3 | 1.35.88 | AWS SDK (DynamoDB, S3, SES, Secrets Manager) |
| pydantic-settings | 2.7.1 | Environment variable management |

---

## Directory Structure

```
backend/
├── api.py                 # FastAPI app initialization, routers, CORS, middleware
├── app_config.py          # Configuration classes (DynamoDB, JWT, SES, file extensions)
├── pyproject.toml         # Dependencies, Ruff config, pytest config
├── requirements.txt       # Pinned deps for Lambda deployment
│
├── auth/                  # Authentication module
│   ├── routers.py        # /api/auth/* endpoints (login, refresh, logout)
│   ├── models.py         # Token, TokenPayload models
│   ├── operations.py     # JWT generation, password verification, token management
│   └── exceptions.py     # InvalidTokenError, MissingRefreshTokenError, etc.
│
├── users/                 # User management module
│   ├── routers.py        # /api/users/* endpoints (register, me, list, update, delete)
│   ├── models.py         # User, UserCreate, UserUpdate, UserSecret models
│   ├── operations.py     # User CRUD, password hashing, validation
│   ├── roles.py          # UserRole enum, ROLE_HIERARCHY
│   └── exceptions.py     # UserNotFoundError, UserAlreadyExistsError, etc.
│
├── news/                  # News module
│   ├── routers.py        # /api/news/* endpoints
│   ├── models.py         # News, NewsUpdate, NewsType models
│   ├── operations.py     # News CRUD, subscriber notifications
│   └── exceptions.py     # NewsNotFoundError
│
├── products/              # Products module
│   ├── routers.py        # /api/products/* endpoints
│   ├── models.py         # Product, ProductUpdate models
│   ├── operations.py     # Product CRUD
│   └── exceptions.py     # ProductNotFoundError
│
├── gallery/               # Gallery module
│   ├── routers.py        # /api/gallery/* endpoints
│   ├── models.py         # GalleryImage, GalleryImageMetadata models
│   ├── operations.py     # Image upload/delete (S3), presigned URL generation
│   └── exceptions.py     # InvalidImageFormatError, ImageNotFoundError, etc.
│
├── files/                 # Document management module
│   ├── routers.py        # /api/files/* endpoints
│   ├── models.py         # FileMetadata, FileMetadataFull, FileType enum
│   ├── operations.py     # File upload/download/delete (S3), access control
│   └── exceptions.py     # FileNotFoundError, FileAccessDeniedError, etc.
│
├── members/               # Cooperative member module
│   ├── routers.py        # /api/members/* endpoints
│   ├── models.py         # Member, MemberPublic, MemberUpdate models
│   ├── operations.py     # Member CRUD, CSV sync, member code validation
│   └── exceptions.py     # MemberNotFoundError, InvalidFileTypeError
│
├── mail/                  # Email module
│   ├── routers.py        # /api/mail/* endpoints
│   ├── operations.py     # SES email sending, HTML templates, link construction
│   └── exceptions.py     # EmailSendError, InvalidTokenError
│
├── database/              # Database layer
│   ├── db_config.py      # DynamoDB client/resource factory
│   ├── repositories.py   # Base + 7 entity repositories
│   └── exceptions.py     # DatabaseError
│
├── middleware/            # Custom middleware
│   └── cache_headers.py  # Cache-Control header middleware
│
├── utils/                 # Utilities
│   └── decorators.py     # @retry decorator with exponential backoff
│
└── tests/                 # Test suite
    ├── conftest.py
    ├── test_auth_operations.py
    ├── test_users_operations.py
    ├── test_files_operations.py
    └── test_news_operations.py
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | No | Login with email/password, returns JWT tokens |
| POST | `/refresh` | No | Refresh access token using refresh token cookie |
| POST | `/logout` | No | Invalidate refresh token, clear cookie |

### Users (`/api/users`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/me` | Yes | Any | Get current authenticated user |
| GET | `/list` | Yes | Regular+, Accountant | List all users |
| GET | `/board` | No | - | Public: board members |
| GET | `/control` | No | - | Public: control board members |
| POST | `/register` | No | - | Register (requires valid member code) |
| POST | `/reset-password` | No | - | Reset password with token |
| GET | `/activate-account` | No | - | Email verification link handler |
| PUT | `/update/{user_id}` | Yes | Admin | Update user (role, active, subscribed) |
| DELETE | `/delete/{user_id}` | Yes | Admin | Delete user (cannot delete self) |

### News (`/api/news`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/list` | Optional | - | List news (private news requires auth) |
| POST | `/create` | Yes | Admin | Create news + notify subscribers |
| PUT | `/update/{news_id}` | Yes | Admin | Update news |
| DELETE | `/delete/{news_id}` | Yes | Admin | Delete news |

### Products (`/api/products`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/list` | No | - | Public: list all products |
| POST | `/create` | Yes | Admin | Create product |
| PUT | `/update/{product_id}` | Yes | Admin | Update product |
| DELETE | `/delete/{product_id}` | Yes | Admin | Delete product |

### Gallery (`/api/gallery`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/list` | No | - | Public: list gallery images with URLs |
| POST | `/create` | Yes | Admin | Upload image (max 15MB; jpg/png/gif/webp) |
| DELETE | `/delete/{image_id}` | Yes | Admin | Delete image from S3 + DynamoDB |
| GET | `/{image_id}/url` | No | - | Get presigned/CloudFront URL |

### Files / Documents (`/api/files`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/create` | Yes | Admin, Accountant | Upload document to S3 |
| GET | `/list` | Yes | Varies by type | List files filtered by type |
| DELETE | `/delete/{file_id}` | Yes | Admin, Accountant | Delete file |
| POST | `/download` | Yes | Any authenticated | Download file (streaming) |
| GET | `/shared-with-me` | Yes | Any authenticated | Files explicitly shared with current user |
| GET | `/shared-audit` | Yes | Admin | All shared files expanded per recipient |
| PATCH | `/{file_id}/share` | Yes | Admin | Add users to a file's allowed_to list |
| DELETE | `/{file_id}/shared-with/{user_id}` | Yes | Admin | Remove a user from a file's allowed_to list |

**Document Types & Access:**

| Type | Public | Regular | Board/Control | Accountant | Admin |
|------|--------|---------|---------------|------------|-------|
| `governing_documents` | Read | Read | Read | - | Full |
| `forms` | Read | Read | Read | - | Full |
| `minutes` | - | Read | Read | - | Full |
| `transcripts` | - | Read | Read | - | Full |
| `accounting` | - | - | - | Read+Upload | Full |
| `private_documents` | - | If allowed | If allowed | If allowed | Full |
| `others` | - | Read | Read | - | Full |

### Members (`/api/members`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/list` | Yes | Any | List members (detail level varies by role) |
| POST | `/create` | Yes | Admin | Create member |
| PUT | `/update/{member_code}` | Yes | Admin | Update member email/phone |
| DELETE | `/delete/{member_code}` | Yes | Admin | Delete member |
| POST | `/sync_members` | No | - | Bulk sync members from CSV |

### Email (`/api/mail`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/send-news` | No | Send news notification to user |
| POST | `/forgot-password` | No | Send password reset email |
| GET | `/unsubscribe` | No | Unsubscribe from notifications |

---

## Authentication & Authorization

### Authentication Flow

```
1. POST /auth/login  ->  Verify email + password (Argon2)
                     ->  Generate access token (5 min) + refresh token (7 days)
                     ->  Store refresh token JTI in DynamoDB
                     ->  Set refresh token as HTTP-only cookie
                     ->  Return { access_token, refresh_token, token_type }

2. Request with expired token  ->  401 response
   POST /auth/refresh          ->  Verify refresh token from cookie
                               ->  Invalidate old token in DB
                               ->  Issue new token pair

3. POST /auth/logout  ->  Invalidate refresh token in DB
                      ->  Clear HTTP-only cookie
```

### JWT Token Structure

**Access Token (5 min):**
```json
{ "sub": "user_id", "role": "admin", "type": "access", "exp": 1234567890 }
```

**Refresh Token (7 days):**
```json
{ "sub": "user_id", "role": "admin", "type": "refresh", "jti": "unique_id", "exp": 1234567890 }
```

### Role Hierarchy

```python
ROLE_HIERARCHY = {
    ADMIN:        [ADMIN, CONTROL, BOARD, ACCOUNTANT, REGULAR_USER],
    CONTROL:      [CONTROL, BOARD, REGULAR_USER],
    BOARD:        [BOARD, REGULAR_USER],
    ACCOUNTANT:   [ACCOUNTANT],
    REGULAR_USER: [REGULAR_USER],
}
```

### Dependency Injection

```python
@router.get("/protected")
async def protected(
    user: User = Depends(get_current_user),            # Auth required
    _: User = Depends(role_required([UserRole.ADMIN])), # Role check
    repo: UserRepository = Depends(get_user_repository) # Repository
):
    ...
```

---

## Database Schema (DynamoDB)

| Table | Primary Key | GSI | Description |
|-------|-------------|-----|-------------|
| `users_table` | `id` (UUID) | `email_index` (email) | User accounts |
| `refresh_table` | `id` (JTI) | - | Refresh tokens (TTL: expires_at) |
| `news_table` | `id` (UUID) | `news_created_at_index` | News articles |
| `gallery_table` | `id` (UUID) | `gallery_created_at_index` | Gallery images |
| `uploads_table` | `id` (UUID) | `file_type_created_at_index` | Document metadata |
| `members_table` | `member_code` | - | Cooperative members |
| `products_table` | `id` (UUID) | - | Products |

### Repository Pattern

All database access goes through repositories extending `BaseRepository`:

```python
class BaseRepository(ABC):
    def __init__(self, table_name: str):
        self.table = get_dynamodb_resource().Table(table_name)

    @abstractmethod
    def convert_item_to_object(self, item: dict) -> Any:
        pass
```

Concrete repositories: `UserRepository`, `AuthRepository`, `NewsRepository`, `GalleryRepository`, `FileMetadataRepository`, `MemberRepository`, `ProductRepository`

---

## Data Models (Pydantic)

### User Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `UserCreate` | Registration | first_name, last_name, email, phone, password, member_code |
| `User` | API response | id, first_name, last_name, email, phone, role, active, subscribed, created_at |
| `UserUpdate` | Admin updates | email?, phone?, role?, active?, subscribed? |
| `UserSecret` | Internal only | id, email, member_code, role, active, salt, password_hash |

### Other Models

| Model | Key Fields |
|-------|------------|
| `News` | title, content, news_type (regular/private) |
| `Product` | id?, name, width?, height?, length?, description? |
| `FileMetadata` | id?, file_name?, file_type, uploaded_by?, created_at |
| `GalleryImageMetadata` | id, image_name, s3_key, s3_bucket, uploaded_by, url? |
| `Member` | first_name, last_name, email?, phone?, member_code, proxy |
| `MemberPublic` | first_name, last_name, proxy (limited view) |

---

## Middleware

### CacheControlMiddleware

| Pattern | Cache Duration | Endpoints |
|---------|---------------|-----------|
| Long (1 hour) | `max-age=3600` | products/list, gallery/list, users/board |
| Medium (10 min) | `max-age=600` | news/list |
| Short (5 min) | `max-age=300` | users/list |
| No cache | `no-cache, no-store` | Mutations, errors |

---

## Email System

| Email Type | Trigger | Expiry |
|------------|---------|--------|
| Account verification | User registration | 1 hour |
| Password reset | Forgot password | 3 minutes |
| News notification | News creation | N/A |
| Unsubscribe | Email link | N/A |

Provider: **AWS SES** | Sender: `notifications@murdjovpojar.com` | Templates: Bulgarian HTML

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Password | 8-30 chars, uppercase, lowercase, digit, special char (!@#$%^&?) |
| Phone | 10 or 13 digits, starts with 0 or +359, stored as +359XXXXXXXXX |
| File uploads | Allowed extensions: images, docs, spreadsheets, presentations |
| Gallery images | jpg, jpeg, png, gif, webp only, max 15MB |

---

## Configuration

Key variables: `USERS_TABLE_NAME`, `UPLOADS_BUCKET`, `GALLERY_BUCKET`, `JWT_SECRET_ARN`, `FRONTEND_BASE_URL`, `MAIL_SENDER`, `COOKIE_DOMAIN`

---

## Development

```bash
# Start dev server (port 8000)
make backend-run

# API docs: http://localhost:8000/api/docs (Swagger UI)
# API docs: http://localhost:8000/api/redoc (ReDoc)

# Testing
make backend-test         # Run pytest
make backend-test-cov     # With coverage

# Code quality
make backend-lint         # Ruff lint
make backend-format       # Ruff format
make backend-check        # All checks
```

### Ruff Configuration

- Line length: 120 | Indent: 2 spaces | Quotes: double | Target: Python 3.12
- Rules: E, W, F, I, N, UP, B, C4, SIM, TCH, PTH, RUF
