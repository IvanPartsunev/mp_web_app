// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/context/apiClient';

export interface User {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  user_code?: string;
  is_code_valid?: boolean;
}

// Query key factory
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: () => [...userKeys.lists()] as const,
  board: () => [...userKeys.all, 'board'] as const,
  control: () => [...userKeys.all, 'control'] as const,
};

// Fetch all users (admin)
export function useUsersList() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<User[]>('users/list');
      return response.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (admin panel)
  });
}

// Fetch board members
export function useBoardMembers() {
  return useQuery({
    queryKey: userKeys.board(),
    queryFn: async () => {
      const response = await apiClient.get<User[]>('users/board');
      return response.data ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Fetch control members
export function useControlMembers() {
  return useQuery({
    queryKey: userKeys.control(),
    queryFn: async () => {
      const response = await apiClient.get<User[]>('users/control');
      return response.data ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...user }: User & { id: string }) => {
      const response = await apiClient.put(`users/update/${id}`, user);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`users/delete/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
