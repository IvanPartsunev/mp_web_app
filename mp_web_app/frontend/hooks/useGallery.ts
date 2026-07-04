// hooks/useGallery.ts
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import apiClient from "@/context/apiClient";

export interface GalleryImage {
  id: string;
  image_name: string;
  category: string;
  s3_key: string;
  s3_bucket: string;
  uploaded_by: string;
  created_at: string;
  url?: string;
}

// Query key factory
export const galleryKeys = {
  all: ["gallery"] as const,
  lists: () => [...galleryKeys.all, "list"] as const,
  list: (variant: "public" | "admin" = "public") => [...galleryKeys.lists(), variant] as const,
};

const galleryQueryFn = async () => {
  const response = await apiClient.get<GalleryImage[]>("gallery/list");
  return response.data ?? [];
};

const adminGalleryQueryFn = async () => {
  const response = await apiClient.get<GalleryImage[]>("gallery/list");
  return response.data ?? [];
};

// Public gallery — 5 minute cache
export function useGallery() {
  return useQuery({
    queryKey: galleryKeys.list("public"),
    queryFn: galleryQueryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Admin gallery — always fresh, bypasses browser HTTP cache via X-Admin-Request header
export function useAdminGallery() {
  return useQuery({
    queryKey: galleryKeys.list("admin"),
    queryFn: adminGalleryQueryFn,
    staleTime: 0,
  });
}

// Create gallery image mutation
export function useCreateGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.post("gallery/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: galleryKeys.lists()});
    },
  });
}

// Delete gallery image mutation
export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`gallery/delete/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: galleryKeys.lists()});
    },
  });
}

// Update gallery image metadata mutation
export function useUpdateGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({id, image_name, category}: {id: string; image_name: string; category: string}) => {
      const response = await apiClient.patch<GalleryImage>(`gallery/${id}/metadata`, {image_name, category});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: galleryKeys.lists()});
    },
  });
}
