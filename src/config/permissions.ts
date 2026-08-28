export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  PV_VIEW: "pv.view",
  PV_APPROVE: "pv.approve",
  PV_PAY: "pv.pay",
  FINANCE_ARCHIVE_VIEW: "finance-archive.view",
  REPORTS_VIEW: "reports.view",
  MASTER_DATA_VENDOR: "master-data.vendor",
  MASTER_DATA_CUSTOMER: "master-data.customer",
  MASTER_DATA_COMPANY: "master-data.company",
  MASTER_DATA_PROJECT: "master-data.project",
  USER_MGMT_USERS: "user-management.users",
  USER_MGMT_ROLES: "user-management.roles",
  USER_MGMT_PROFILE: "user-management.profile",
  USER_MGMT_ACTIVITY_LOG: "user-management.activity-log",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Pengelompokan permission untuk ditampilkan sebagai checklist di halaman
 * Edit Role (bukan daftar datar 1 kolom) - dipakai oleh RolePermissionForm.
 */
export const PERMISSION_GROUPS: { label: string; permissions: { key: Permission; label: string }[] }[] = [
  {
    label: "Dashboard",
    permissions: [{ key: PERMISSIONS.DASHBOARD_VIEW, label: "Lihat Dashboard" }],
  },
  {
    label: "Payment Voucher",
    permissions: [
      { key: PERMISSIONS.PV_VIEW, label: "Lihat & Buat Payment Voucher" },
      { key: PERMISSIONS.PV_APPROVE, label: "Approve / Reject Payment Voucher" },
      { key: PERMISSIONS.PV_PAY, label: "Tandai Payment Voucher Dibayar" },
    ],
  },
  {
    label: "Arsip & Laporan Finance",
    permissions: [
      { key: PERMISSIONS.FINANCE_ARCHIVE_VIEW, label: "Lihat Arsip Transaksi" },
      { key: PERMISSIONS.REPORTS_VIEW, label: "Lihat Laporan (Voucher/Tax/Cash Flow)" },
    ],
  },
  {
    label: "Master Data",
    permissions: [
      { key: PERMISSIONS.MASTER_DATA_VENDOR, label: "Kelola Vendor" },
      { key: PERMISSIONS.MASTER_DATA_CUSTOMER, label: "Kelola Customer" },
      { key: PERMISSIONS.MASTER_DATA_COMPANY, label: "Kelola Company" },
      { key: PERMISSIONS.MASTER_DATA_PROJECT, label: "Kelola Project" },
    ],
  },
  {
    label: "Manajemen User & Akses",
    permissions: [
      { key: PERMISSIONS.USER_MGMT_USERS, label: "Kelola Daftar User" },
      { key: PERMISSIONS.USER_MGMT_ROLES, label: "Kelola Daftar Role" },
      { key: PERMISSIONS.USER_MGMT_PROFILE, label: "Akses Profil Saya" },
      { key: PERMISSIONS.USER_MGMT_ACTIVITY_LOG, label: "Lihat Log Aktivitas" },
    ],
  },
];
