// hooks/useProducts.ts
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import apiClient from "@/context/apiClient";

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
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (variant: "public" | "admin" = "public") => [...productKeys.lists(), variant] as const,
};

const productQueryFn = async () => {
  const response = await apiClient.get<Product[]>("products/list");
  return response.data ?? [];
};

// Public products
export function useProducts() {
  return useQuery({
    queryKey: productKeys.list("public"),
    queryFn: productQueryFn,
  });
}

// Admin products
export function useAdminProducts() {
  return useQuery({
    queryKey: productKeys.list("admin"),
    queryFn: productQueryFn,
  });
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<Product, "id">) => {
      const response = await apiClient.post("products/create", product);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: productKeys.lists()});
    },
  });
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({id, ...product}: Product & {id: string}) => {
      const response = await apiClient.put(`products/update/${id}`, product);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: productKeys.lists()});
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
      queryClient.invalidateQueries({queryKey: productKeys.lists()});
    },
  });
}
