// hooks/useNews.ts
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import apiClient from "@/context/apiClient";
import {useAuth} from "@/context/AuthContext";

export interface NewsItem {
  id?: string | null;
  title: string;
  content: string;
  author_id?: string | null;
  created_at?: string | null;
  news_type?: "regular" | "private";
}

// Query key factory
export const newsKeys = {
  all: ["news"] as const,
  lists: () => [...newsKeys.all, "list"] as const,
  list: () => [...newsKeys.lists()] as const,
};

// Fetch news list
export function useNews() {
  const {isLoggedIn, user} = useAuth();

  return useQuery({
    queryKey: [...newsKeys.list(), {isLoggedIn, userId: user?.id}],
    queryFn: async () => {
      // Token is automatically sent via Authorization header by apiClient
      const response = await apiClient.get<NewsItem[]>("news/list");
      return response.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (reduced from 10 to be more responsive)
  });
}

// Create news mutation
export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (news: Omit<NewsItem, "id" | "created_at">) => {
      const response = await apiClient.post("news/create", news);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: newsKeys.lists()});
    },
  });
}

// Update news mutation (with optimistic update)
export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({id, ...news}: NewsItem & {id: string}) => {
      const response = await apiClient.put(`news/update/${id}`, news);
      return response.data;
    },
    onMutate: async (updatedNews) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({queryKey: newsKeys.lists()});

      // Snapshot all matching news list caches
      const previousData = queryClient.getQueriesData<NewsItem[]>({queryKey: newsKeys.lists()});

      // Optimistically update all cached news list variants
      queryClient.setQueriesData<NewsItem[]>({queryKey: newsKeys.lists()}, (old) =>
        old?.map((item) => (item.id === updatedNews.id ? {...item, ...updatedNews} : item))
      );

      return {previousData};
    },
    onError: (_err, _vars, context) => {
      // Roll back to the snapshot on failure
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always reconcile with the server after success or failure
      queryClient.invalidateQueries({queryKey: newsKeys.lists()});
    },
  });
}

// Delete news mutation
export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`news/delete/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: newsKeys.lists()});
    },
  });
}
