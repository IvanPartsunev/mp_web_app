# Components

Reusable UI components for the MP Web App.

## Organization

```
components/
├── ui/              # Base UI components (shadcn/ui)
└── *.tsx            # Feature-specific components
```

### ui/ Directory

Base UI components from shadcn/ui. These are building blocks:
- `button.tsx`, `input.tsx`, `textarea.tsx`
- `table.tsx` (TableHeader, TableRow, TableCell, etc.)
- `dialog.tsx`, `select.tsx`, `card.tsx`
- `loading-spinner.tsx`

### Feature Components

| Component | Purpose |
|-----------|---------|
| `admin-layout.tsx` | Layout wrapper for admin pages |
| `confirm-dialog.tsx` | Reusable confirmation modal |
| `files-table.tsx` | Table for displaying files with pagination |
| `products-table.tsx` | Table for displaying products with pagination |
| `gallery-modal.tsx` | Full-screen image viewer |
| `login-form.tsx` | Login form with validation |
| `upload-file.tsx` | File upload with drag-and-drop |

## Creating New Components

1. Create component in `components/` (or `components/ui/` for base UI)
2. Use TypeScript interfaces for props
3. Import UI components from `@/components/ui/`
4. Use shared styles from `@/lib/styles` or `@/lib/tableUtils`

Example:
```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TABLE_STYLES } from "@/lib/tableUtils";

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Card>
      <h2>{title}</h2>
      <Button onClick={onAction}>Click me</Button>
    </Card>
  );
}
```

## Table Components

For tables, use the shared `TABLE_STYLES` from `lib/tableUtils.ts`:

```tsx
import { TABLE_STYLES, COLUMN_WIDTHS } from "@/lib/tableUtils";

<div className={TABLE_STYLES.scrollWrapper}>
  <Table className={TABLE_STYLES.tableBase}>
    <TableHeader>
      <TableRow>
        <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>
          No
        </TableHead>
        {/* more columns */}
      </TableRow>
    </TableHeader>
  </Table>
</div>
```

This ensures:
- Consistent column widths
- Horizontal scrolling on small screens
- No content overflow
