# Frontend - React + TypeScript SPA

The frontend is a single-page application built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**. It serves both the public-facing website and the admin dashboard.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.7.3 | Type safety |
| Vite | 6.0.7 | Build tool & dev server |
| Tailwind CSS | 4.1.11 | Utility-first styling |
| React Router DOM | 6.28.1 | Client-side routing |
| TanStack React Query | 5.90.9 | Server state management & caching |
| Axios | 1.7.9 | HTTP client with interceptors |
| Radix UI | Various | Accessible headless UI primitives |
| Lucide React | 0.468.0 | Icon library |
| next-themes | 0.4.6 | Dark mode support |
| Sonner | 2.0.7 | Toast notifications |
| class-variance-authority | 0.7.1 | Component variants |

---

## Directory Structure

```
frontend/
├── src/                    # App entry point
│   ├── main.tsx           # React root render
│   └── App.tsx            # Root component with routing
│
├── components/            # Reusable UI components
│   ├── ui/                # Base UI primitives (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── checkbox.tsx
│   │   ├── badge.tsx
│   │   ├── pagination.tsx
│   │   ├── loading-spinner.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── alert-dialog.tsx
│   │   └── aspect-ratio.tsx
│   │
│   ├── admin-layout.tsx   # Admin panel wrapper layout
│   ├── confirm-dialog.tsx # Reusable confirmation dialog
│   ├── login-form.tsx     # Login form
│   ├── register.tsx       # Registration form
│   ├── forgot-password.tsx
│   ├── new-password.tsx
│   ├── upload-file.tsx    # Document upload form
│   ├── news-card.tsx      # News article card
│   └── products-table.tsx # Products display table
│
├── pages/                 # Route page components
│   ├── Navigation.tsx     # Main navigation (responsive)
│   ├── Home.tsx           # News feed landing page
│   ├── Products.tsx       # Product catalog
│   ├── Gallery.tsx        # Image gallery with modal
│   ├── Contacts.tsx       # Contact info & map
│   ├── Unsubscribe.tsx    # Email unsubscribe handler
│   │
│   ├── about-us/          # Organization info pages
│   │   ├── Board.tsx      # Board members list
│   │   └── Control.tsx    # Control board members list
│   │
│   ├── lists/             # Member directory pages
│   │   ├── Proxies.tsx    # Proxy members list
│   │   └── CooperativeMembers.tsx  # All members list
│   │
│   ├── documents/         # Document viewer pages
│   │   ├── GoverningDocuments.tsx
│   │   ├── Forms.tsx
│   │   ├── Minutes.tsx
│   │   ├── Transcripts.tsx
│   │   ├── AccountingDocuments.tsx
│   │   ├── MyDocuments.tsx     # Private documents for user
│   │   └── Others.tsx
│   │
│   ├── authentication/    # Auth flow pages
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── NewPassword.tsx
│   │
│   └── admin/             # Admin dashboard
│       ├── AdminPanel.tsx         # Tabbed admin layout
│       ├── NewsManagement.tsx     # News CRUD
│       ├── UserManagement.tsx     # User management
│       ├── ProductsManagement.tsx # Product CRUD
│       ├── DocumentsManagement.tsx# Document management
│       ├── GalleryManagement.tsx  # Gallery upload/delete
│       ├── MembersManagement.tsx  # Member management + CSV sync
│       ├── FileManagement.tsx     # File management
│       └── EmailsManagement.tsx   # Email management (hidden)
│
├── hooks/                 # Custom React hooks
│   ├── useNews.ts         # News data fetching
│   ├── useUsers.ts        # User data fetching
│   ├── useProducts.ts     # Product data fetching
│   ├── useGallery.ts      # Gallery data fetching
│   ├── useFiles.ts        # File/document data fetching
│   ├── useMembers.ts      # Member data fetching
│   ├── usePagination.ts   # Generic pagination logic
│   └── use-toast.ts       # Toast notification hook
│
├── context/               # React context providers
│   ├── AuthContext.tsx     # Authentication state & methods
│   └── apiClient.ts       # Axios instance with interceptors
│
├── lib/                   # Utilities and configuration
│   ├── app-config.ts      # API base URL configuration
│   ├── api.ts             # Simple API helper (POST)
│   ├── errorUtils.ts      # Error message extraction & Bulgarian translation
│   ├── tableUtils.ts      # Table formatting helpers
│   └── utils.ts           # cn() utility (clsx + tailwind-merge)
│
├── public/                # Static assets
├── index.html             # HTML entry point
├── vite.config.mts        # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── eslint.config.js       # ESLint configuration
├── .prettierrc.json       # Prettier configuration
└── package.json           # Dependencies & scripts
```

---

## Routing

All routes are defined in `src/App.tsx` using React Router DOM v6.

### Public Routes (No Auth Required)

| Path | Component | Description |
|------|-----------|-------------|
| `/` or `/home` | `Home` | News feed with pagination |
| `/products` | `Products` | Product catalog with dimensions table |
| `/gallery` | `Gallery` | Masonry image gallery with modal viewer |
| `/contacts` | `Contacts` | Contact info, map, and history |
| `/board` | `Board` | Board members list |
| `/control` | `Control` | Control board members list |
| `/governing-documents` | `GoverningDocuments` | Public governing documents |
| `/forms` | `Forms` | Public forms |
| `/login` | `Login` | Login form |
| `/register` | `Register` | Registration form |
| `/forgot-password` | `ForgotPassword` | Password reset request |
| `/new-password` | `NewPassword` | Set new password |
| `/unsubscribe` | `Unsubscribe` | Email unsubscribe |

### Protected Routes (Auth Required)

| Path | Component | Required Role | Description |
|------|-----------|---------------|-------------|
| `/proxies` | `Proxies` | Any authenticated | Proxy members list |
| `/cooperative` | `CooperativeMembers` | Any authenticated | All members directory |
| `/minutes` | `Minutes` | Any authenticated | Meeting minutes |
| `/transcripts` | `Transcripts` | Any authenticated | Meeting transcripts |
| `/accounting-documents` | `AccountingDocuments` | Admin, Accountant | Accounting files |
| `/mydocuments` | `MyDocuments` | Any authenticated | Private documents |
| `/others` | `Others` | Any authenticated | Other documents |
| `/upload` | `UploadFile` | Admin, Accountant | File upload form |
| `/admin` | `AdminPanel` | Admin | Full admin dashboard |

---

## State Management

### Server State (React Query)

All API data is managed via **TanStack React Query** with custom hooks. Each hook follows a consistent pattern:

```typescript
// Query key factory
const newsKeys = {
  all: ['news'],
  lists: () => [...newsKeys.all, 'list'],
  list: () => [...newsKeys.lists()],
};

// Query hook
export function useNews() {
  return useQuery({
    queryKey: newsKeys.list(),
    queryFn: () => apiClient.get('/news/list'),
  });
}

// Mutation hooks with cache invalidation
export function useCreateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.post('/news/create', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: newsKeys.all }),
  });
}
```

### Hooks Overview

| Hook | Entity | Queries | Mutations |
|------|--------|---------|-----------|
| `useNews` | News | list | create, update, delete |
| `useUsers` | Users | list, board, control, me | update, delete |
| `useProducts` | Products | list | create, update, delete |
| `useGallery` | Gallery | list | create (upload), delete |
| `useFiles` | Files | list (by type) | create (upload), delete, download |
| `useMembers` | Members | list | create, update, delete, sync |
| `usePagination` | Generic | N/A | N/A (pagination state) |

### Client State (React Context)

**AuthContext** manages authentication:
- `isLoggedIn` - Boolean auth status
- `user` - Current user data (id, email, name, role)
- `login(accessToken)` - Store token and decode user
- `logout()` - Clear tokens and state
- `checkAuth()` - Verify current auth status

---

## API Client

### Axios Instance (`context/apiClient.ts`)

- Base URL configured from `lib/app-config.ts`
- **Request interceptor:** Injects `Authorization: Bearer <token>` header
- **Response interceptor:** On 401, attempts token refresh via `/auth/refresh`
- **Token refresh flow:**
  1. Detect 401 response
  2. Call `/auth/refresh` (refresh token in HTTP-only cookie)
  3. Store new access token
  4. Retry original request
  5. On failure, trigger logout

### Error Handling (`lib/errorUtils.ts`)

All API errors pass through `extractApiErrorDetails()` which:
1. Extracts error messages from FastAPI validation errors
2. Translates English error messages to **Bulgarian** for user display
3. Handles nested error formats (string, array, object)

Translated categories: validation, password rules, phone format, email format, file upload, auth, not-found, permission, and database errors.

---

## Component Architecture

### UI Component Library (shadcn/ui)

The `components/ui/` directory contains **shadcn/ui** components built on **Radix UI** primitives. These are unstyled, accessible components styled with Tailwind CSS:

- **Button** - Multiple variants (default, destructive, outline, ghost)
- **Dialog** - Modal dialogs with overlay
- **Table** - Styled data tables
- **Tabs** - Tabbed interfaces
- **Select** - Dropdown selects
- **Input/Textarea** - Form inputs
- **Toast/Sonner** - Notification system
- **Badge** - Status badges
- **Switch** - Toggle switches
- **Pagination** - Page navigation controls

### Key Feature Components

**Gallery Page:**
- Masonry layout with responsive columns (1-4)
- Intersection Observer for lazy loading images
- Full-screen modal with previous/next navigation
- Hover effects (scale, shadow, name overlay)

**Admin Panel:**
- Tabbed interface (desktop) / dropdown (mobile)
- Persists active tab in localStorage
- 6 management sections: News, Users, Products, Documents, Gallery, Members

**File Upload:**
- Drag-and-drop zone with visual feedback
- File type validation (format + size)
- Role-based upload restrictions (Admin: all types, Accountant: accounting only)
- Multi-user access control for private documents

**Navigation:**
- Responsive design: full menu (desktop) / hamburger (mobile)
- Dropdown menus for documents and lists sections
- Role-based menu item visibility
- Active route highlighting

---

## TypeScript Interfaces

### Core Data Types

```typescript
interface User {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  active?: boolean;
  subscribed?: boolean;
  created_at?: string;
}

interface NewsItem {
  id?: string | null;
  title: string;
  content: string;
  author_id?: string | null;
  created_at?: string | null;
  news_type?: "regular" | "private";
}

interface Product {
  id?: string | null;
  name: string;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  description?: string | null;
}

interface GalleryImage {
  id: string;
  image_name: string;
  s3_key: string;
  s3_bucket: string;
  uploaded_by: string;
  created_at: string;
  url?: string;
}

interface FileMetadata {
  id?: string | null;
  file_name?: string | null;
  file_type: FileType;
  uploaded_by?: string | null;
  uploaded_by_name?: string | null;
  created_at?: string | null;
}

type FileType =
  | 'governing_documents' | 'forms' | 'minutes' | 'transcripts'
  | 'accounting' | 'private_documents' | 'others';

interface Member {
  member_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  proxy?: boolean;
  member_code_valid?: boolean;
}
```

---

## Language

The UI is entirely in **Bulgarian**. All user-facing text (labels, buttons, error messages, toasts) is in Bulgarian. The `errorUtils.ts` file translates backend English error messages to Bulgarian for display.

---

## Development

### Scripts

```bash
pnpm dev              # Start dev server (port 3000)
pnpm build            # TypeScript check + production build
pnpm preview          # Preview production build
pnpm lint             # ESLint check (max 100 warnings)
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
pnpm type-check       # TypeScript type checking
```

Or via Makefile from project root:

```bash
make frontend-dev
make frontend-build
make frontend-lint
make frontend-format
make frontend-check   # lint + format-check + type-check
```

### Path Aliases

The `@/` alias maps to the frontend root directory:

```typescript
import { Button } from "@/components/ui/button";
import { useNews } from "@/hooks/useNews";
import { apiClient } from "@/context/apiClient";
```

### Code Style

- **Prettier:** Double quotes, 120 char width, 2-space indent, trailing commas (ES5)
- **ESLint:** TypeScript recommended + React hooks rules
- **No explicit `any`:** Warned (not blocked)
- **Unused variables:** Warned (prefix with `_` to suppress)
