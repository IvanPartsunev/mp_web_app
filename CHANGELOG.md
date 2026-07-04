# Changelog

All notable changes to the GPK "Murdjov Pozhar" web platform are documented here.

---

## [Unreleased]

---

## [2026-07-04] — Products overhaul, inquiry module, file labels, lint/test fixes

### Added
- `parse_sizes` public function in `products/operations.py` for parsing JSON size strings
- `value` field on `ProductSize` model to support free-text size descriptions
- Inquiry module: full CRUD, scoped access, file attachments, PDF export, email notifications
- File labels feature: label tagging for documents with combobox UI and existing-label suggestions
- Upload notifications: email broadcasts to subscribers when new files are uploaded
- Backend tests for members, products, files, mail, and users operations (150 tests total)

### Changed
- `create_product` signature simplified — removed legacy `width`, `height`, `length` form fields
- `update_product` router endpoint updated to match new signature, dropping legacy dimension params
- `products/routers.py` now uses shared `parse_sizes` from operations instead of local `_parse_sizes`
- `ProductUpdate` model cleaned up to remove legacy flat dimension fields from router usage
- Frontend prettier formatting applied to 7 files (`files-table.tsx`, `product-card.tsx`, `products-table.tsx`, `DocumentsManagement.tsx`, `ProductsManagement.tsx`, `Proxies.tsx`, `Products.tsx`)
- Board and control filters in members list and CSV export
- Reimplemented `Board` and `Control` pages with member filtering and pagination
- Removed `CacheControlMiddleware` and `adminApiClient`, simplified cache logic

### Fixed
- All ruff lint errors in backend: `SIM103`, `SIM117`, `C408` violations across `inquiries/operations.py` and `tests/test_members_operations.py`
- `dict()` calls rewritten as dict literals throughout test files
- Nested `with` statements merged into single context manager
- Backend format check: `test_members_operations.py` and `products/routers.py` reformatted
- Empty member name field handling in normalization and sorting logic

---

## [2026-06-06] — Bulk uploads, UI polish, file metadata

### Added
- Bulk image uploads and metadata updates in gallery management
- Multiple file uploads support with improved file validation UX
- File metadata update support and improved share/revoke functionality
- Category combo field component
- Search functionality in members list with user phone/name redaction mutations

### Changed
- Replaced action buttons with icons and standardized column widths across tables
- Adjusted table and column widths for better responsiveness and consistency
- Set production API base URL in app config

### Fixed
- Table column minimum width for improved readability
- API base URL
- Proxy evaluation to use lowercase comparison
- Linting issues and phone number validation for numbers without country prefix

---

## [2026-05-13] — Pagination, DynamoDB billing, member sync

### Added
- Table pagination for `CooperativeMembers` and `Proxies` lists
- Support for exposed headers in CORS configuration
- Dynamic filename from API response for members CSV export
- CSV dialect detection in `convert_members_list`

### Changed
- Switched all DynamoDB tables to on-demand billing mode
- Optimized batch processing for member updates with `batch_writer`
- Sorted board and control members alphabetically by name
- CDK deploy command updated with `--no-rollback` and skip-approval flags

### Fixed
- Member sync batching logic
- CSV filename header exposure

---

## [2026-05-09 – 2026-05-10] — File sharing, shared audit, caching, CloudFront

### Added
- `ShareFileDialog` component for file sharing functionality
- `add_share` and `revoke_share` operations with remaining recipient handling
- User-specific file access and "Shared with Me" feature
- File share notification emails with background task for user notifications
- `SharedFilesAudit` page with pagination and revoke functionality
- Audit and revoke share endpoints for shared files
- CloudFront distribution ID output and cache invalidation after frontend deployment

### Changed
- Cache headers aligned with React Query tiers; stale times updated
- Split admin and public query hooks; increased cache durations for static resources
- Pagination implemented across all admin management pages
- Improved error type safety — replaced `any` with `ApiError` in admin pages
- CORS updated to allow both `www` and non-`www` origins; news cache set to private

### Fixed
- News link construction in notifications for correct frontend redirection
- Paginated queries in `get_all_news`
- Email subjects and titles localized to Bulgarian
- Email and notification sender addresses updated to production values

---

## [2026-04-13] — CI/CD workflows, infrastructure logging

### Added
- CDK CLI installation step in deployment workflow
- Lambda log group and optimized API Gateway logging settings

### Changed
- Replaced pull-request-lint workflow with separate CI and deploy workflows
- Split dependency installation into backend and frontend steps in deploy workflow
- Updated tsconfig to suppress deprecation warnings for TypeScript 6.0

---

## [2026-02-19] — Project documentation, admin panel

### Added
- Comprehensive project documentation (README files for backend, frontend, infrastructure)

### Changed
- Emails tab hidden from admin panel

---

## [2026-01-12] — User and file management improvements

### Changed
- News, Documents, User, and File management updated with defaults and null checks
- Table styling standardized with pixel-based column widths

---

## [2025-12-07] — Error handling, caching, UI consistency

### Added
- Comprehensive error handling for image uploads and validations

### Changed
- Enhanced error handling, caching, and UI consistency across components
- Unified table column styles and enhanced metadata handling

### Fixed
- Member code validation logic in `CooperativeMembers` and `Proxies`

---

## [2025-11-15] — React Query, admin panel, gallery, mobile nav

### Added
- Reusable React Query hooks for data fetching with caching
- Extended admin panel functionality (news, products, users, documents management pages)
- `Footer`, `Header`, and `GalleryModal` components with responsive design
- Enhanced mobile navigation and image loading
- `S3:DeleteObject` permission in `BackendStack`
- Favicon for site branding

### Changed
- Replaced manual API calls with React Query hooks
- Navigation component structure simplified; menu item spacing improved
- Cache invalidation step and middleware order in backend updated
- Gallery page: removed lazy loading logic

---

## [2025-11-14] — Accountant role, products table

### Added
- `Accountant` role with tailored permissions across frontend and backend
- Products table support in `BackendStack`

### Changed
- Navigation restructured; product management UI added
- API base URL switched to production

---

## [2025-11-12 – 2025-11-13] — Products, members, gallery, domain exceptions

### Added
- Product management module with full CRUD support
- Products repository and model with Decimal field support
- Member management API endpoints (create, update, delete, list)
- Proxy-based member filtering and public model response
- Gallery image management (upload, list, delete, presigned URL / CloudFront)
- Domain-specific exceptions replacing raw `HTTPException` usage throughout
- `MemberRepository` separate from user repository

### Changed
- API endpoints standardized across backend and frontend
- Imports cleaned up and formatting standardized across modules
- `DatabaseError` centralized

---

## [2025-11-08 – 2025-11-11] — Full frontend + auth overhaul

### Added
- Full React + TypeScript frontend initialized (Vite, Tailwind, Radix UI)
- `AuthContext` with token validation on mount and multi-tab sync
- `tokenStore`, JWT expiry utilities, and `apiClient` with token refresh logic
- Toast notifications and enhanced API error handling
- Admin panel skeleton (news, document, user management)
- Gallery backend module (models, operations, repository)
- File operations tests and test utilities
- Unsubscribe flow and enhanced dialog handling
- Board and control members pages with dynamic data fetching
- Contacts page redesigned with modern UI components
- `setup.sh` automated dev setup script; migrated to Hatchling build backend

### Changed
- `AuthRepository` introduced for refresh token storage with JTI tracking
- `database.repositories` replaced `database.operations` module
- Refresh token endpoint with HTTP-only cookies implemented
- Token invalidation on refresh (old JTI blacklisted)
- Role-based access control hierarchy introduced

### Fixed
- Router imports and auth router registration
- Async/sync function signatures corrected across auth and user operations
- `get_user_by_email` parameter type updated to accept both `EmailStr` and `str`

---

## [2025-09-24 – 2025-09-25] — Custom domain, file downloads, cookie handling

### Added
- Custom domain support for API Gateway (`api.murdjovpojar.com`) to resolve cross-domain cookie issues
- Route 53 A record pointing to API Gateway
- `COOKIE_DOMAIN` environment variable for shared-domain cookie setting
- Public file download endpoint; `s3:GetObject` IAM action granted
- `FilesTable` component with pagination and file download functionality

### Changed
- `UploadFile` component refactored to simplify upload workflow with user selection for private files
- `apiClient` replaced direct axios calls in `FilesTable`
- `download_file` refactored to accept `User` object and update permission logic
- Navigation hidden for unauthenticated users
- Access token expiration reduced to 1 minute (later increased)

---

## [2025-05-26] — Email service (AWS SES)

### Added
- Email service integration with AWS SES
- `SesSettings` class for email configuration
- Email templates with unsubscribe functionality (verification, password reset, news notifications)

---

## [2025-05-11 – 2025-05-25] — Auth system, JWT, token refresh

### Added
- JWT authentication with token creation and validation (`python-jose`)
- User sign-in endpoint with JWT token generation
- HTTP-only secure cookie for refresh token
- Token refresh endpoint with refresh token rotation
- TTL field for refresh tokens in DynamoDB
- `AuthRepository` for refresh token storage and JTI tracking
- Token blacklist check on refresh

### Changed
- `app_config` module created for centralized configuration settings
- Auth module separated from users module
- Role-based access control with `ROLE_HIERARCHY` introduced

### Fixed
- OAuth2 token URL and sign-in response model
- Async/sync function signatures across auth and user operations
- Regular users allowed to reset their own passwords
- DynamoDB local command updated to use persistent storage path

---

## [2025-04-21 – 2025-05-03] — Project bootstrap, user CRUD, DynamoDB

### Added
- Initial project structure created with Projen
- FastAPI application with users route
- `UserRepository` with full CRUD operations for DynamoDB
- DynamoDB configuration with Pydantic settings and Docker setup for local development
- User sign-up endpoint
- Password hashing with Argon2
- User exception classes
- Persistent storage for local DynamoDB

### Changed
- Project paths reorganized from `mp_api` to `backend` directory structure
- Import paths updated throughout

---

*Dates represent the date of the relevant git commits. Grouped by feature/release cycle.*
