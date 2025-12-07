// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/context/apiClient';

export interface Product {
  id?: string | null;
  name: string;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  description?: string | null;
}

// Query key factory
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: () => [...productKeys.lists()] as const,
};

// Fetch products list
export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<Product[]>('products/list');
      return response.data ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour (products rarely change)
  });
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id'>) => {
      const response = await apiClient.post('products/create', product);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate products list to refetch
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
    },
  });
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: Product & { id: string }) => {
      const response = await apiClient.put(`products/update/${id}`, product);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
    },
  });
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`products/delete/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
    },
  });
}
