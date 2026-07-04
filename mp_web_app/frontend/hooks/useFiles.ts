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
  allowed_to?: string[] | null;
  labels?: string[] | null;
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
  labels?: string[] | null;
}

// Query key factory
export const fileKeys = {
  all: ["files"] as const,
  lists: () => [...fileKeys.all, "list"] as const,
  list: (fileType?: FileType) => [...fileKeys.lists(), {fileType}] as const,
  sharedAudit: () => [...fileKeys.all, "shared-audit"] as const,
  labels: () => [...fileKeys.all, "labels"] as const,
};

// Fetch files by type (documents page)
export function useFiles(fileType: FileType, options?: {enabled?: boolean}) {
  return useQuery({
    queryKey: fileKeys.list(fileType),
    queryFn: async () => {
      const response = await apiClient.get<FileMetadata[]>("files/list", {
        params: {file_type: fileType},
        withCredentials: true,
      });
      return response.data ?? [];
    },
    enabled: options?.enabled ?? true,
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
  });
}

// Update file metadata mutation (admin only)
export function useUpdateFileMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      file_name,
      file_type,
      labels,
    }: {
      id: string;
      file_name: string;
      file_type: FileType;
      labels?: string[] | null;
    }) => {
      const response = await apiClient.patch<FileMetadata>(`files/${id}/metadata`, {file_name, file_type, labels});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: fileKeys.all});
    },
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

// Fetch all files shared with the current user (any file_type where user is in allowed_to)
export function useSharedWithMe() {
  return useQuery({
    queryKey: [...fileKeys.all, "shared-with-me"] as const,
    queryFn: async () => {
      const response = await apiClient.get<FileMetadata[]>("files/shared-with-me");
      return response.data ?? [];
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

// Share file mutation (admin only)
export function useShareFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({fileId, userIds}: {fileId: string; userIds: string[]}) => {
      const response = await apiClient.patch<{allowed_to: string[]}>(`files/${fileId}/share`, {
        user_ids: userIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: fileKeys.all});
    },
  });
}

// Fetch all existing label strings (admin / accountant only)
export function useFileLabels() {
  return useQuery({
    queryKey: fileKeys.labels(),
    queryFn: async () => {
      const response = await apiClient.get<string[]>("files/labels");
      return response.data ?? [];
    },
  });
}
