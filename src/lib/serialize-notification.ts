import type { Notification as ApiNotification, NotificationType } from "@/types/notification";

interface PrismaNotification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

export function serializeNotification(notification: PrismaNotification): ApiNotification {
  return {
    id: notification.id,
    title: notification.title,
    description: notification.description,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  };
}
