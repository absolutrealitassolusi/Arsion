import { useQuery } from "@tanstack/react-query";
import { activityLogService } from "@/services/activity-log.service";

const activityLogKeys = {
  all: ["activity-logs"] as const,
  list: (actor?: string) => [...activityLogKeys.all, actor ?? "all"] as const,
};

export function useActivityLogs(actor?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: activityLogKeys.list(actor),
    queryFn: () => activityLogService.getAll(actor),
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}
