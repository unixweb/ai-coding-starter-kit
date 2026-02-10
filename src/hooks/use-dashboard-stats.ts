import useSWR from "swr";

export interface DashboardStats {
  userName: string;
  uploadsToday: number;
  uploadsThisWeek: number;
  activePortals: number;
  inactivePortals: number;
  totalUploads: number;
  totalSubmissions: number;
  lastActivity: string | null;
  recentFiles: { name: string; size: string; uploadedAt: string }[];
  activePortalLinks: {
    id: string;
    label: string;
    submission_count: number;
    is_active: boolean;
  }[];
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    "/api/dashboard/stats"
  );

  return {
    stats: data ?? null,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
