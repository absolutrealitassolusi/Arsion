import type { ActivityLog as ApiActivityLog } from "@/types/activity-log";

interface DbActivityLog {
  id: string;
  actor: string;
  action: string;
  detail: string;
  createdAt: Date;
}

export function serializeActivityLog(log: DbActivityLog): ApiActivityLog {
  return {
    id: log.id,
    actor: log.actor,
    action: log.action,
    detail: log.detail,
    createdAt: log.createdAt.toISOString(),
  };
}
