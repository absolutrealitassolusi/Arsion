"use client";

import { Bell, CheckCheck, Info, AlertTriangle, CircleCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications";
import { cn, formatDate } from "@/lib/utils";
import type { NotificationType } from "@/types/notification";

const iconMap: Record<NotificationType, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-primary bg-primary/10" },
  success: { icon: CircleCheck, className: "text-success bg-success/10" },
  warning: { icon: AlertTriangle, className: "text-destructive bg-destructive/10" },
};

export function NotificationDropdown() {
  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();

  const unreadCount = data?.data.filter((n) => !n.isRead).length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifikasi</p>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} belum dibaca</span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}

          {!isLoading && data?.data.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi.
            </p>
          )}

          {data?.data.map((notification) => {
            const { icon: Icon, className } = iconMap[notification.type];
            return (
              <DropdownMenuItem
                key={notification.id}
                className="items-start gap-3 px-4 py-3"
                onClick={() => !notification.isRead && markAsRead.mutate(notification.id)}
              >
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", className)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 space-y-0.5">
                  <span className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", !notification.isRead && "text-foreground")}>
                      {notification.title}
                    </span>
                    {!notification.isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  <span className="block text-xs text-muted-foreground">{notification.description}</span>
                  <span className="block text-[11px] text-muted-foreground/70">
                    {formatDate(notification.createdAt)}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />
        <button className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-primary hover:bg-accent">
          <CheckCheck className="h-3.5 w-3.5" />
          Tandai semua sudah dibaca
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
