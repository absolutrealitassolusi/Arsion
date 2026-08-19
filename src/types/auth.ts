import type { Permission } from "@/config/permissions";

/**
 * User yang lagi login. `permissions` sudah di-union dari SEMUA role yang
 * dimiliki user (bukan cuma 1 role) - lihat src/lib/current-user.ts.
 */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roleNames: string[];
  permissions: Permission[];
}
