export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface ActivityLogListResponse {
  data: ActivityLog[];
  total: number;
}
