// lib/queryClient.ts
import {QueryClient} from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 0 means data is immediately stale after fetching,
      // so invalidation always triggers a real refetch.
      // Hooks that benefit from longer caching override this individually.
      staleTime: 0,
      // Cache time: how long unused data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests
      retry: 1,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
  },
});
