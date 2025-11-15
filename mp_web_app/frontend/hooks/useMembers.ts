// hooks/useMembers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/context/apiClient';

export interface Member {
  member_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role?: string;
  is_proxy?: boolean;
}

// Query key factory
export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (filters?: { proxy_only?: boolean; role?: string }) => 
    [...memberKeys.lists(), filters] as const,
};

// Fetch members list
export function useMembers(filters?: { proxy_only?: boolean; role?: string }) {
  return useQuery({
    queryKey: memberKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<Member[]>('members/list', {
        params: filters,
      });
      return response.data ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Create member mutation
export function useCreateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member: Omit<Member, 'member_code'>) => {
      const response = await apiClient.post('members/create', member);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

// Update member mutation
export function useUpdateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ member_code, ...member }: Member) => {
      const response = await apiClient.put(`members/update/${member_code}`, member);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

// Delete member mutation
export function useDeleteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member_code: string) => {
      await apiClient.delete(`members/delete/${member_code}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
