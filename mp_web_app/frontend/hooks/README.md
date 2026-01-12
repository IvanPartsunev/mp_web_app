# Hooks

Custom React hooks for data fetching and state management.

## Data Fetching Hooks

All data fetching uses React Query for caching and state management.

### Available Hooks

| Hook | Cache Time | Purpose |
|------|------------|---------|
| `useProducts()` | 1 hour | Fetch products list |
| `useNews()` | 5 min | Fetch news articles |
| `useGallery()` | 1 hour | Fetch gallery images |
| `useFiles(type)` | 1 min | Fetch files by type |
| `useAllFiles()` | 5 min | Fetch all files (admin) |
| `useUsersList()` | 5 min | Fetch all users (admin) |
| `useBoardMembers()` | 1 hour | Fetch board members |
| `useControlMembers()` | 1 hour | Fetch control members |
| `useMembers(opts)` | 5 min | Fetch cooperative members |

### Mutation Hooks

For creating, updating, or deleting data:

| Hook | Auto-invalidates |
|------|------------------|
| `useCreateProduct()` | products list |
| `useUpdateProduct()` | products list |
| `useDeleteProduct()` | products list |
| `useCreateNews()` | news list |
| `useUpdateNews()` | news list |
| `useDeleteNews()` | news list |
| `useCreateGalleryImage()` | gallery list |
| `useDeleteGalleryImage()` | gallery list |
| `useUpdateUser()` | users list |
| `useDeleteUser()` | users list |
| `useDeleteFile()` | files list |

## Usage Examples

### Fetching Data

```tsx
import { useProducts } from "@/hooks/useProducts";

function ProductList() {
  const { data: products = [], isLoading, error } = useProducts();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p>Error loading products</p>;

  return products.map(p => <div key={p.id}>{p.name}</div>);
}
```

### Creating Data

```tsx
import { useCreateProduct } from "@/hooks/useProducts";

function CreateProductForm() {
  const createMutation = useCreateProduct();

  const handleSubmit = () => {
    createMutation.mutate(
      { name: "New Product", description: "..." },
      {
        onSuccess: () => toast({ title: "Product created" }),
        onError: (err) => toast({ title: "Error", variant: "destructive" }),
      }
    );
  };
}
```

## Utility Hooks

### usePagination

Reusable pagination logic for tables:

```tsx
import { usePagination } from "@/hooks/usePagination";

const {
  pageItems,      // Items for current page
  page,           // Current page number (1-indexed)
  totalPages,     // Total number of pages
  goToPage,       // Function to navigate to page
  nextPage,       // Go to next page
  prevPage,       // Go to previous page
  hasNext,        // Boolean: has next page
  hasPrev,        // Boolean: has previous page
  startIdx,       // Start index for current page
  endIdx,         // End index for current page
  total,          // Total item count
} = usePagination(items, 25); // 25 items per page
```

## Cache Configuration

Cache times are set based on data volatility:
- **1 hour**: Products, gallery, board/control members (rarely change)
- **5 minutes**: News, files, users (may change more often)
- **1 minute**: Individual file type queries

Data is automatically refetched when:
- Cache expires
- Window regains focus (after 30+ seconds)
- A mutation invalidates the cache
