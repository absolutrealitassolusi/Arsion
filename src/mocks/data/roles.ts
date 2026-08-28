import { PERMISSIONS } from "@/config/permissions";
import type { Role } from "@/types/role";

/**
 * Nama/Deskripsi/permission role sudah CRUD beneran lewat mock API.
 * Nama role di sini juga harus disamakan manual dengan roleOptions
 * di components/modules/users/user-form.tsx.
 */
export const dummyRoles: Role[] = [
  {
    id: "ROLE-0001",
    name: "Admin",
    description: "Akses penuh ke seluruh modul sistem.",
    userCount: 1,
    permissions: Object.values(PERMISSIONS),
  },
  {
    id: "ROLE-0002",
    name: "Staff Finance",
    description: "Membuat Payment Voucher, menandai pembayaran, dan mengelola Master Data Finance.",
    userCount: 1,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.PV_VIEW,
      PERMISSIONS.PV_PAY,
      PERMISSIONS.FINANCE_ARCHIVE_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.MASTER_DATA_VENDOR,
      PERMISSIONS.MASTER_DATA_CUSTOMER,
      PERMISSIONS.MASTER_DATA_PROJECT,
      PERMISSIONS.USER_MGMT_USERS,
      PERMISSIONS.USER_MGMT_PROFILE,
    ],
  },
  {
    id: "ROLE-0003",
    name: "Manager",
    description: "Approval Payment Voucher dan akses laporan.",
    userCount: 1,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.PV_VIEW,
      PERMISSIONS.PV_APPROVE,
      PERMISSIONS.FINANCE_ARCHIVE_VIEW,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.USER_MGMT_PROFILE,
      PERMISSIONS.USER_MGMT_ACTIVITY_LOG,
    ],
  },
  {
    id: "ROLE-0004",
    name: "GA Officer",
    description: "Mengelola aset & keperluan General Affairs (modul Asset belum dibangun, jadi permission-nya masih minim).",
    userCount: 1,
    permissions: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.USER_MGMT_PROFILE],
  },
];
