# Pages

Page components organized by feature.

## Directory Structure

```
pages/
├── admin/          # Admin panel pages
├── about-us/       # About pages (Board, Control)
├── documents/      # Document listing pages
├── lists/          # Member lists (Proxies, CooperativeMembers)
├── Home.tsx        # Landing page
├── Products.tsx    # Products catalog
├── Gallery.tsx     # Image gallery
├── Profile.tsx     # User profile
├── Navigation.tsx  # Header navigation
└── ...
```

## Public Pages

Accessible without login:
- `Home.tsx` - Landing page with news
- `Products.tsx` - Products catalog
- `Gallery.tsx` - Image gallery
- `about-us/Board.tsx` - Board members
- `about-us/Control.tsx` - Control members
- `documents/*.tsx` - Document listings

## Protected Pages

Require authentication:
- `Profile.tsx` - User profile

## Admin Pages

Require admin role (`/admin/*`):

| Page | Purpose |
|------|---------|
| `AdminPanel.tsx` | Admin dashboard with tabs |
| `UserManagement.tsx` | Manage users and roles |
| `ProductsManagement.tsx` | CRUD for products |
| `NewsManagement.tsx` | CRUD for news articles |
| `DocumentsManagement.tsx` | Manage documents |
| `FileManagement.tsx` | Bulk file management |
| `GalleryManagement.tsx` | Manage gallery images |
| `MembersManagement.tsx` | Manage cooperative members |

## Role-Based Visibility

Some content visibility depends on user role:

| Role | Access Level |
|------|--------------|
| `regular` | Basic member access |
| `board` | Board member access |
| `control` | Control member access |
| `accountant` | Accounting documents access |
| `admin` | Full access |

Role checks happen in components using `useAuth()`:

```tsx
const { user, isLoggedIn } = useAuth();
const isAdmin = user?.role === "admin";
const canSeePhone = isAdmin || user?.role === "board";
```

## Page Patterns

### Hero Section

Use `HERO_STYLES` for consistent hero sections:

```tsx
import { HERO_STYLES } from "@/lib/styles";

<section className={HERO_STYLES.section}>
  <div className={HERO_STYLES.overlay} />
  <div className={HERO_STYLES.container}>
    <div className={HERO_STYLES.content}>
      <h1 className={HERO_STYLES.title}>Page Title</h1>
    </div>
  </div>
</section>
```

### Data Tables

Use `TABLE_STYLES` for consistent tables:

```tsx
import { TABLE_STYLES, COLUMN_WIDTHS } from "@/lib/tableUtils";

<div className={TABLE_STYLES.scrollWrapper}>
  <Table className={TABLE_STYLES.tableBase}>
    <TableHeader>
      <TableRow>
        <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>
          No
        </TableHead>
      </TableRow>
    </TableHeader>
  </Table>
</div>
```

### Loading States

Use `LoadingSpinner` component:

```tsx
if (loading) return <LoadingSpinner />;
```

### Empty States

```tsx
if (items.length === 0) {
  return <p className="text-center text-muted-foreground py-8">No items</p>;
}
```
