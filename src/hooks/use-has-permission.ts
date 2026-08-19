import { useCurrentUser } from "@/hooks/use-current-user";
import type { Permission } from "@/config/permissions";

/**
 * Cek apakah user yang login punya permission tertentu (union dari semua
 * role yang dia punya, sudah dihitung sekali di server - lihat
 * src/lib/current-user.ts). Dipakai buat ngunci tombol aksi
 * (Approve/Reject/Pay) - bukan cuma mengandalkan menu Sidebar yang
 * disembunyikan, karena orang bisa aja langsung buka URL detail PV tanpa
 * lewat menu.
 */
export function useHasPermission(permission: Permission): boolean {
  const { permissions } = useCurrentUser();
  return permissions.includes(permission);
}
