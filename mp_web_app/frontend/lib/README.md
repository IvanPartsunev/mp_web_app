# Lib

Utilities, constants, and shared configurations.

## Files

| File             | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `styles.ts`      | Shared CSS class constants                   |
| `tableUtils.ts`  | Table styling and pagination utilities       |
| `utils.ts`       | General utilities (cn for className merging) |
| `errorUtils.ts`  | API error message extraction                 |
| `api.ts`         | API helper functions                         |
| `queryClient.ts` | React Query configuration                    |

## styles.ts

Shared style constants for consistent UI across pages.

### HERO_STYLES

For page hero/header sections:

```tsx
import {HERO_STYLES} from "@/lib/styles";

<section className={HERO_STYLES.section}>
  <div className={HERO_STYLES.overlay} />
  <div className={HERO_STYLES.container}>
    <div className={HERO_STYLES.content}>
      <h1 className={HERO_STYLES.title}>Title</h1>
    </div>
  </div>
</section>;
```

### SECTION_STYLES

For content sections:

```tsx
import {SECTION_STYLES} from "@/lib/styles";

<section className={SECTION_STYLES.fullWidth}>{/* content */}</section>;
```

### Other Style Constants

- `CARD_STYLES` - Card component styling
- `LOADING_STYLES` - Loading state containers
- `ERROR_STYLES` - Error message styling
- `EMPTY_STYLES` - Empty state styling
- `ANIMATION_STYLES` - Common animations
- `FORM_STYLES` - Form input styling

## tableUtils.ts

Table-specific styles and utilities.

### TABLE_STYLES

```tsx
import {TABLE_STYLES, COLUMN_WIDTHS} from "@/lib/tableUtils";

<div className={TABLE_STYLES.scrollWrapper}>
  {" "}
  {/* Horizontal scroll on small screens */}
  <Table className={TABLE_STYLES.tableBase}>
    {" "}
    {/* Min-width for proper layout */}
    <TableHeader>
      <TableRow>
        <TableHead className={`${TABLE_STYLES.headBase} ${COLUMN_WIDTHS.rowNumber}`}>No</TableHead>
        <TableHead className={TABLE_STYLES.headBase}>Name</TableHead>
        <TableHead className={TABLE_STYLES.headCenter}>Centered</TableHead>
        <TableHead className={TABLE_STYLES.headRight}>Right</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className={TABLE_STYLES.rowNumberCell}>{index + 1}</TableCell>
        <TableCell className={TABLE_STYLES.cellBase}>Value</TableCell>
        <TableCell className={TABLE_STYLES.cellCenter}>Center</TableCell>
        <TableCell className={TABLE_STYLES.cellRight}>Right</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>;
```

### COLUMN_WIDTHS

Predefined column width classes:

- `rowNumber` - 5% width for row number column
- `actions` - Width for action buttons

### getRowNumber

Utility for paginated row numbers:

```tsx
import {getRowNumber} from "@/lib/tableUtils";

// getRowNumber(index, page, pageSize) returns correct row number
const rowNum = getRowNumber(0, 2, 25); // Returns 26 (first item on page 2)
```

### Message Constants

- `EMPTY_MESSAGES` - Standard empty state messages
- `LOADING_MESSAGES` - Standard loading messages

## utils.ts

### cn()

Utility for merging Tailwind classes (from shadcn/ui):

```tsx
import {cn} from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />;
```

## errorUtils.ts

### extractApiErrorDetails

Extract readable error messages from API responses:

```tsx
import {extractApiErrorDetails} from "@/lib/errorUtils";

const errorMessage = extractApiErrorDetails(error.response?.data) || "Default error";
```

## queryClient.ts

React Query client configuration with default settings:

- Error handling
- Retry logic
- Cache configuration
