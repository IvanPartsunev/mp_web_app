// hooks/useFiles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/context/apiClient';

export type FileType =
  | 'governing_documents'
  | 'forms'
  | 'minutes'
  | 'transcripts'
  | 'accounting'
  | 'private_documents'
  | 'others';

export interface FileMetadata {
  id?: string | null;
  file_name?: string | null;
  file_type: FileType;
  uploaded_by?: string | null;
  created_at?: string | null;
}

// Query key factory
export const fileKeys = {
  all: ['files'] as const,
  lists: () => [...fileKeys.all, 'list'] as const,
  list: (fileType?: FileType) => [...fileKeys.lists(), { fileType }] as const,
};

// Fetch files by type
export function useFiles(fileType: FileType) {
  return useQuery({
    queryKey: fileKeys.list(fileType),
    queryFn: async () => {
      const response = await apiClient.get<FileMetadata[]>('files/list', {
        params: { file_type: fileType },
        withCredentials: true,
      });
      return response.data ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Fetch all files (admin)
export function useAllFiles() {
  return useQuery({
    queryKey: fileKeys.lists(),
    queryFn: async () => {
      const fileTypes: FileType[] = [
        'governing_documents',
        'forms',
        'minutes',
        'transcripts',
        'accounting',
        'private_documents',
        'others',
      ];
      
      const allFiles: FileMetadata[] = [];
      for (const type of fileTypes) {
        try {
          const response = await apiClient.get<FileMetadata[]>('files/list', {
            params: { file_type: type },
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
    staleTime: 5 * 60 * 1000, // 5 minutes (admin panel)
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
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
    },
  });
}
