import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => dashboardService.getStats(),
    staleTime: 30_000,
  });
}
