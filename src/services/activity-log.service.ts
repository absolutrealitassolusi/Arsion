import { api } from "@/lib/axios";
import type { ActivityLogListResponse } from "@/types/activity-log";

export const activityLogService = {
  async getAll(actor?: string): Promise<ActivityLogListResponse> {
    const { data } = await api.get<ActivityLogListResponse>("/activity-logs", {
      params: actor ? { actor } : undefined,
    });
    return data;
  },
};
