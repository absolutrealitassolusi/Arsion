import {
  LayoutDashboard,
  Receipt,
  Database,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS } from "@/config/permissions";

export interface NavItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  permission?: string;
  children?: NavItem[];
}

/**
 * Single source of truth untuk struktur menu ERP.
 * Dipakai oleh <SidebarNav /> (render menu) dan <Breadcrumb />
 * (mapping segment URL -> label yang enak dibaca).
 *
 * Item yang punya `children` adalah parent yang bisa expand/collapse
 * dan sengaja tidak punya `href` sendiri (bukan halaman, cuma pengelompokan).
 * Item tanpa `children` adalah leaf yang benar-benar menuju satu halaman.
 */
export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    label: "Finance",
    icon: Receipt,
    children: [
      {
        label: "PV",
        children: [
          { label: "PV In", href: "/finance/pv/pv-in", permission: PERMISSIONS.PV_VIEW },
          { label: "PV Out", href: "/finance/pv/pv-out", permission: PERMISSIONS.PV_VIEW },
        ],
      },
      {
        label: "Approval",
        href: "/finance/approval",
        permission: PERMISSIONS.PV_APPROVE,
      },
      {
        label: "Payment",
        href: "/finance/payment",
        permission: PERMISSIONS.PV_PAY,
      },
      {
        label: "Tax",
        children: [
          { label: "Tax In", href: "/finance/tax/tax-in", permission: PERMISSIONS.PV_PAY },
          { label: "Tax Out", href: "/finance/tax/tax-out", permission: PERMISSIONS.PV_PAY },
        ],
      },
      {
        label: "Archive",
        href: "/finance/archive",
        permission: PERMISSIONS.FINANCE_ARCHIVE_VIEW,
      },
      {
        label: "Reports",
        children: [
          { label: "Voucher Report", href: "/finance/reports/voucher-report", permission: PERMISSIONS.REPORTS_VIEW },
          { label: "Tax Report", href: "/finance/reports/tax-report", permission: PERMISSIONS.REPORTS_VIEW },
          { label: "Cash Flow Report", href: "/finance/reports/cash-flow-report", permission: PERMISSIONS.REPORTS_VIEW },
        ],
      },
    ],
  },
  {
    label: "Master Data",
    icon: Database,
    children: [
      { label: "Vendor", href: "/master-data/vendor", permission: PERMISSIONS.MASTER_DATA_VENDOR },
      { label: "Customer", href: "/master-data/customer", permission: PERMISSIONS.MASTER_DATA_CUSTOMER },
      { label: "Company", href: "/master-data/company", permission: PERMISSIONS.MASTER_DATA_COMPANY },
    ],
  },
  {
    label: "Manajemen User & Akses",
    icon: ShieldCheck,
    children: [
      { label: "Daftar User", href: "/manajemen-user/daftar-user", permission: PERMISSIONS.USER_MGMT_USERS },
      { label: "Daftar Role", href: "/manajemen-user/daftar-role", permission: PERMISSIONS.USER_MGMT_ROLES },
      { label: "Profil Saya", href: "/manajemen-user/profil-saya", permission: PERMISSIONS.USER_MGMT_PROFILE },
      { label: "Log Aktivitas", href: "/manajemen-user/log-aktivitas", permission: PERMISSIONS.USER_MGMT_ACTIVITY_LOG },
    ],
  },
];

/** Map segment URL -> label yang enak dibaca, dipakai oleh <Breadcrumb />. */
export const segmentLabelMap: Record<string, string> = {
  dashboard: "Dashboard",
  finance: "Finance",
  pv: "PV",
  "pv-in": "PV In",
  "pv-out": "PV Out",
  approval: "Approval",
  payment: "Payment",
  tax: "Tax",
  "tax-in": "Tax In",
  "tax-out": "Tax Out",
  archive: "Archive",
  reports: "Reports",
  "voucher-report": "Voucher Report",
  "tax-report": "Tax Report",
  "cash-flow-report": "Cash Flow Report",
  "master-data": "Master Data",
  vendor: "Vendor",
  customer: "Customer",
  company: "Company",
  "manajemen-user": "Manajemen User & Akses",
  "daftar-user": "Daftar User",
  "daftar-role": "Daftar Role",
  "profil-saya": "Profil Saya",
  "log-aktivitas": "Log Aktivitas",
  create: "Tambah",
  edit: "Edit",
};
