# MP Web App Frontend

React-based frontend for the MP Web Application.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **React Query** (@tanstack/react-query) - Server state management and caching
- **shadcn/ui** - UI component library

## Directory Structure

```
frontend/
├── components/     # Reusable UI components
├── context/        # React context providers (Auth, API client)
├── hooks/          # Custom React hooks (data fetching, pagination)
├── lib/            # Utilities, constants, and shared styles
├── pages/          # Page components and routing
└── public/         # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

## Architecture Patterns

### Data Fetching

All API calls use React Query hooks located in `hooks/`. Benefits:
- Automatic caching (reduces API calls)
- Background refetching
- Loading and error states
- Cache invalidation on mutations

Example:
```tsx
const { data: products, isLoading } = useProducts();
```

### Styling

Shared style constants in `lib/styles.ts` and `lib/tableUtils.ts` ensure consistent UI across pages.

```tsx
import { HERO_STYLES, TABLE_STYLES } from "@/lib/styles";
```

### Authentication

Auth state managed via `AuthContext`. Role-based access controls what users can see/do.

See individual directory READMEs for more details:
- [components/README.md](./components/README.md)
- [hooks/README.md](./hooks/README.md)
- [pages/README.md](./pages/README.md)
- [lib/README.md](./lib/README.md)
