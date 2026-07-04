import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import apiClient from "@/context/apiClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClosingRecord {
  closed_by_id: string;
  closed_by_name: string;
  final_status: string;
  reason: string;
  pdf_s3_key?: string | null;
  closed_at: string;
}

export interface Inquiry {
  id: string;
  title: string;
  description: string;
  inquiry_type: string;
  scope: string[];
  author_id: string;
  author_name?: string | null;
  co_authors: string[];
  co_author_names: string[];
  status: string;
  entry_number?: string | null;
  file_s3_keys: string[];
  closing_record?: ClosingRecord | null;
  created_at: string;
  updated_at: string;
}

// Bulgarian display labels
export const STATUS_BG: Record<string, string> = {
  sent: "Изпратено",
  accepted: "Прието",
  in_progress: "В процес",
  closed: "Затворено",
  finished: "Приключено",
  failed: "Неуспешно",
};

export const INQUIRY_TYPES = ["молба", "запитване", "сигнал"] as const;

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const inquiryKeys = {
  all: ["inquiries"] as const,
  mine: () => [...inquiryKeys.all, "mine"] as const,
  addressedToMe: () => [...inquiryKeys.all, "addressed-to-me"] as const,
  adminAll: () => [...inquiryKeys.all, "all"] as const,
  detail: (id: string) => [...inquiryKeys.all, id] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useMyInquiries() {
  return useQuery({
    queryKey: inquiryKeys.mine(),
    queryFn: async () => {
      const res = await apiClient.get<Inquiry[]>("inquiries/mine");
      return res.data ?? [];
    },
  });
}

export function useAddressedToMe() {
  return useQuery({
    queryKey: inquiryKeys.addressedToMe(),
    queryFn: async () => {
      const res = await apiClient.get<Inquiry[]>("inquiries/addressed-to-me");
      return res.data ?? [];
    },
  });
}

export function useAllInquiries() {
  return useQuery({
    queryKey: inquiryKeys.adminAll(),
    queryFn: async () => {
      const res = await apiClient.get<Inquiry[]>("inquiries/all");
      return res.data ?? [];
    },
  });
}

export function useInquiry(id: string) {
  return useQuery({
    queryKey: inquiryKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<Inquiry>(`inquiries/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post<Inquiry>("inquiries/create", formData, {
        headers: {"Content-Type": "multipart/form-data"},
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: inquiryKeys.all});
    },
  });
}

export function useUpdateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, formData}: {id: string; formData: FormData}) => {
      const res = await apiClient.put<Inquiry>(`inquiries/${id}`, formData, {
        headers: {"Content-Type": "multipart/form-data"},
      });
      return res.data;
    },
    onSuccess: (_data, {id}) => {
      queryClient.invalidateQueries({queryKey: inquiryKeys.detail(id)});
      queryClient.invalidateQueries({queryKey: inquiryKeys.mine()});
    },
  });
}

export function useAddInquiryFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, formData}: {id: string; formData: FormData}) => {
      const res = await apiClient.post<Inquiry>(`inquiries/${id}/files`, formData, {
        headers: {"Content-Type": "multipart/form-data"},
      });
      return res.data;
    },
    onSuccess: (_data, {id}) => {
      queryClient.invalidateQueries({queryKey: inquiryKeys.detail(id)});
    },
  });
}

export function useAssignEntryNumber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, entry_number}: {id: string; entry_number: string}) => {
      const res = await apiClient.post<Inquiry>(`inquiries/${id}/entry-number`, {entry_number});
      return res.data;
    },
    onSuccess: (_data, {id}) => {
      queryClient.invalidateQueries({queryKey: inquiryKeys.detail(id)});
      queryClient.invalidateQueries({queryKey: inquiryKeys.all});
    },
  });
}

export function useCloseInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({id, formData}: {id: string; formData: FormData}) => {
      const res = await apiClient.post<Inquiry>(`inquiries/${id}/close`, formData, {
        headers: {"Content-Type": "multipart/form-data"},
      });
      return res.data;
    },
    onSuccess: (_data, {id}) => {
      queryClient.invalidateQueries({queryKey: inquiryKeys.detail(id)});
      queryClient.invalidateQueries({queryKey: inquiryKeys.all});
    },
  });
}

export function useDeleteInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`inquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: inquiryKeys.all});
    },
  });
}
