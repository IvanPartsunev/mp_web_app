import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import apiClient from "@/context/apiClient";

export interface ProductSize {
  label: string;
  width?: number | null;
  height?: number | null;
  length?: number | null;
}

export interface Product {
  id?: string | null;
  name: string;
  description?: string | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  sizes?: ProductSize[];
  picture_url?: string | null;
}

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (variant: "public" | "admin" = "public") => [...productKeys.lists(), variant] as const,
};

const productQueryFn = async () => {
  const response = await apiClient.get<Product[]>("products/list");
  return response.data ?? [];
};

export function useProducts() {
  return useQuery({
    queryKey: productKeys.list("public"),
    queryFn: productQueryFn,
  });
}

export function useAdminProducts() {
  return useQuery({
    queryKey: productKeys.list("admin"),
    queryFn: productQueryFn,
  });
}

export interface CreateProductPayload {
  name: string;
  description?: string | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  sizes?: ProductSize[];
  picture?: File | null;
}

export interface UpdateProductPayload extends CreateProductPayload {
  id: string;
  remove_picture?: boolean;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const form = new FormData();
      form.append("name", payload.name);
      if (payload.description) form.append("description", payload.description);
      if (payload.width != null) form.append("width", String(payload.width));
      if (payload.height != null) form.append("height", String(payload.height));
      if (payload.length != null) form.append("length", String(payload.length));
      if (payload.sizes != null) form.append("sizes", JSON.stringify(payload.sizes));
      if (payload.picture) form.append("picture", payload.picture);

      const response = await apiClient.post("products/create", form, {
        headers: {"Content-Type": "multipart/form-data"},
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: productKeys.lists()});
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({id, ...payload}: UpdateProductPayload) => {
      const form = new FormData();
      if (payload.name) form.append("name", payload.name);
      if (payload.description != null) form.append("description", payload.description);
      if (payload.width != null) form.append("width", String(payload.width));
      if (payload.height != null) form.append("height", String(payload.height));
      if (payload.length != null) form.append("length", String(payload.length));
      form.append("remove_picture", String(payload.remove_picture ?? false));
      if (payload.sizes != null) form.append("sizes", JSON.stringify(payload.sizes));
      if (payload.picture) form.append("picture", payload.picture);

      const response = await apiClient.put(`products/update/${id}`, form, {
        headers: {"Content-Type": "multipart/form-data"},
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: productKeys.lists()});
    },
  });
}

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

export function useOrphanedPictures() {
  return useQuery({
    queryKey: ["products", "orphans"],
    queryFn: async () => {
      const response = await apiClient.get<{orphans: string[]; count: number}>("products/orphans");
      return response.data;
    },
    enabled: false,
  });
}

export function useDeleteOrphanedPictures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<{deleted: number}>("products/orphans");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["products", "orphans"]});
      queryClient.invalidateQueries({queryKey: productKeys.lists()});
    },
  });
}
