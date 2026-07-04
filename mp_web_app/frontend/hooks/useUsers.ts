// hooks/useUsers.ts
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import apiClient, {adminApiClient} from "@/context/apiClient";

export interface User {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  active?: boolean;
  subscribed?: boolean;
  user_code?: string;
  is_code_valid?: boolean;
  created_at?: string;
}

// Query key factory
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: () => [...userKeys.lists()] as const,
  board: () => [...userKeys.all, "board"] as const,
  control: () => [...userKeys.all, "control"] as const,
};

// Fetch all users (admin) — always fresh, bypasses browser HTTP cache via X-Admin-Request header
export function useUsersList() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async () => {
      const response = await adminApiClient.get<User[]>("users/list");
      return response.data ?? [];
    },
    staleTime: 0, // admin panel — always fetch fresh data
  });
}

// Fetch board members — 5 minute cache
export function useBoardMembers() {
  return useQuery({
    queryKey: userKeys.board(),
    queryFn: async () => {
      const response = await apiClient.get<User[]>("users/board");
      return response.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch control members — 5 minute cache
export function useControlMembers() {
  return useQuery({
    queryKey: userKeys.control(),
    queryFn: async () => {
      const response = await apiClient.get<User[]>("users/control");
      return response.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({id, ...user}: Partial<User> & {id: string}) => {
      const response = await apiClient.put(`users/update/${id}`, user);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: userKeys.all});
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
      queryClient.invalidateQueries({queryKey: userKeys.all});
    },
  });
}

// Redact user phone — clears phone via update
export function useRedactUserPhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(`users/update/${id}`, {phone: null});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: userKeys.all});
    },
  });
}

// Redact user names — clears first/last name via update
export function useRedactUserNames() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(`users/update/${id}`, {first_name: "[ЗАЛИЧЕНО]", last_name: "[ЗАЛИЧЕНО]"});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: userKeys.all});
    },
  });
}
