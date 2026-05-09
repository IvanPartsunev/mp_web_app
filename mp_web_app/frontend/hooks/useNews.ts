// hooks/useNews.ts
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import apiClient, {adminApiClient} from "@/context/apiClient";
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
  list: (variant: "public" | "admin" = "public") => [...newsKeys.lists(), variant] as const,
};

// Public news hook — 2 minute cache, varies by auth state
export function useNews() {
  const {isLoggedIn, user} = useAuth();

  return useQuery({
    queryKey: [...newsKeys.list("public"), {isLoggedIn, userId: user?.id}],
    queryFn: async () => {
      const response = await apiClient.get<NewsItem[]>("news/list");
      return response.data ?? [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Admin news hook — always fresh, bypasses browser HTTP cache via X-Admin-Request header
export function useAdminNews() {
  return useQuery({
    queryKey: newsKeys.list("admin"),
    queryFn: async () => {
      const response = await adminApiClient.get<NewsItem[]>("news/list");
      return response.data ?? [];
    },
    staleTime: 0,
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
      await queryClient.cancelQueries({queryKey: newsKeys.lists()});
      const previousData = queryClient.getQueriesData<NewsItem[]>({queryKey: newsKeys.lists()});
      queryClient.setQueriesData<NewsItem[]>({queryKey: newsKeys.lists()}, (old) =>
        old?.map((item) => (item.id === updatedNews.id ? {...item, ...updatedNews} : item))
      );
      return {previousData};
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
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
