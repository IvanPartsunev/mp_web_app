// hooks/useFiles.ts
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import apiClient from "@/context/apiClient";

export type FileType =
  | "governing_documents"
  | "forms"
  | "minutes"
  | "transcripts"
  | "accounting"
  | "private_documents"
  | "others";

export interface FileMetadata {
  id?: string | null;
  file_name?: string | null;
  file_type: FileType;
  uploaded_by?: string | null;
  uploaded_by_name?: string | null;
  created_at?: string | null;
}

export interface SharedFileAuditEntry {
  file_id: string;
  file_name: string | null;
  file_type: FileType;
  uploaded_by_id: string | null;
  uploaded_by_name: string | null;
  created_at: string | null;
  shared_with_id: string;
  shared_with_name: string | null;
}

// Query key factory
export const fileKeys = {
  all: ["files"] as const,
  lists: () => [...fileKeys.all, "list"] as const,
  list: (fileType?: FileType) => [...fileKeys.lists(), {fileType}] as const,
  sharedAudit: () => [...fileKeys.all, "shared-audit"] as const,
};

// Fetch files by type (documents page — 2 minute cache)
export function useFiles(fileType: FileType) {
  return useQuery({
    queryKey: fileKeys.list(fileType),
    queryFn: async () => {
      const response = await apiClient.get<FileMetadata[]>("files/list", {
        params: {file_type: fileType},
        withCredentials: true,
      });
      return response.data ?? [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch all files (admin)
export function useAllFiles() {
  return useQuery({
    queryKey: fileKeys.lists(),
    queryFn: async () => {
      const fileTypes: FileType[] = [
        "governing_documents",
        "forms",
        "minutes",
        "transcripts",
        "accounting",
        "private_documents",
        "others",
      ];

      const allFiles: FileMetadata[] = [];
      for (const type of fileTypes) {
        try {
          const response = await apiClient.get<FileMetadata[]>("files/list", {
            params: {file_type: type},
          });
          if (response.data) {
            allFiles.push(...response.data);
          }
        } catch (error) {
          console.error(`Error fetching ${type}:`, error);
        }
      }
      return allFiles;
    },
    staleTime: 0, // admin panel — always fetch fresh data
  });
}

// Delete file mutation
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`files/delete/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: fileKeys.all});
    },
  });
}

// Fetch shared files audit (admin only)
export function useSharedFilesAudit() {
  return useQuery({
    queryKey: fileKeys.sharedAudit(),
    queryFn: async () => {
      const response = await apiClient.get<SharedFileAuditEntry[]>("files/shared-audit");
      return response.data ?? [];
    },
    staleTime: 0,
  });
}

// Revoke share mutation
export function useRevokeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({fileId, userId}: {fileId: string; userId: string}) => {
      await apiClient.delete(`files/${fileId}/shared-with/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: fileKeys.sharedAudit()});
    },
  });
}
