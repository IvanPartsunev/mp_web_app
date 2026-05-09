// hooks/useGallery.ts
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import apiClient from "@/context/apiClient";
import {API_BASE_URL} from "@/app-config";

export interface GalleryImage {
  id: string;
  image_name: string;
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
  const response = await fetch(`${API_BASE_URL}gallery/list`);
  if (!response.ok) throw new Error("Failed to fetch gallery");
  return ((await response.json()) || []) as GalleryImage[];
};

// Public gallery — 2 minute cache
export function useGallery() {
  return useQuery({
    queryKey: galleryKeys.list("public"),
    queryFn: galleryQueryFn,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Admin gallery — always fresh
export function useAdminGallery() {
  return useQuery({
    queryKey: galleryKeys.list("admin"),
    queryFn: galleryQueryFn,
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
