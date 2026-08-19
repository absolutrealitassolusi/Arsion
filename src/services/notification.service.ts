import { api } from "@/lib/axios";
import type { Notification } from "@/types/notification";

export const notificationService = {
  async getAll(): Promise<{ data: Notification[] }> {
    const { data } = await api.get<{ data: Notification[] }>("/notifications");
    return data;
  },

  async markAsRead(id: string): Promise<{ data: Notification }> {
    const { data } = await api.patch<{ data: Notification }>(`/notifications/${id}/read`);
    return data;
  },
};
