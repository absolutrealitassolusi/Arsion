export interface DashboardStats {
  totalPvThisMonth: number;
  pvPendingApproval: number;
  unpaidInvoiceTotal: number;
  totalPaymentThisMonth: number;
}

export interface DashboardStatsResponse {
  data: DashboardStats;
}
