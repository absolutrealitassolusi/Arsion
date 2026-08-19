import { api } from "@/lib/axios";
import type { DashboardStatsResponse } from "@/types/dashboard";

export const dashboardService = {
  async getStats(): Promise<DashboardStatsResponse> {
    const { data } = await api.get<DashboardStatsResponse>("/dashboard/stats");
    return data;
  },
};
