// hooks/useMembers.ts
import {useQuery, useQueryClient} from "@tanstack/react-query";
import apiClient from "@/context/apiClient";

export type MemberEndpoint = "members" | "proxy" | "board" | "control";

export interface Member {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email?: string;
  phone?: string;
  proxy: boolean;
  board: boolean;
  control: boolean;
}

// Query key factory
export const memberKeys = {
  all: ["members"] as const,
  list: (endpoint: MemberEndpoint) => ["members", "list", endpoint] as const,
};

// Fetch members list by endpoint
export function useMembers(endpoint: MemberEndpoint) {
  return useQuery({
    queryKey: memberKeys.list(endpoint),
    queryFn: async () => {
      const response = await apiClient.get<Member[]>(`members/list/${endpoint}`);
      return response.data ?? [];
    },
  });
}

// Invalidate all member list queries
export function useInvalidateMembers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({queryKey: memberKeys.all});
}
