// hooks/useNews.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/context/apiClient';
import { getAccessToken } from '@/context/tokenStore';

export interface NewsItem {
  id?: string | null;
  title: string;
  content: string;
  author?: string | null;
  created_at?: string | null;
  is_public?: boolean;
}

// Query key factory
export const newsKeys = {
  all: ['news'] as const,
  lists: () => [...newsKeys.all, 'list'] as const,
  list: (token?: string) => [...newsKeys.lists(), { token }] as const,
};

// Fetch news list
export function useNews() {
  const token = getAccessToken();
  
  return useQuery({
    queryKey: newsKeys.list(token || undefined),
    queryFn: async () => {
      const response = await apiClient.get<NewsItem[]>('news/list', {
        params: token ? { token } : {},
      });
      return response.data ?? [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create news mutation
export function useCreateNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (news: Omit<NewsItem, 'id' | 'created_at'>) => {
      const response = await apiClient.post('news/create', news);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
    },
  });
}

// Update news mutation
export function useUpdateNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...news }: NewsItem & { id: string }) => {
      const response = await apiClient.put(`news/update/${id}`, news);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: newsKeys.lists() });
    },
  });
}
