"use client";

import { useCurrentUserContext } from "@/context/current-user-context";
import type { CurrentUser } from "@/types/auth";

/**
 * Titik akses tunggal untuk "siapa user yang sedang login". Datanya
 * di-resolve dari session asli (lihat (dashboard)/layout.tsx +
 * CurrentUserProvider) - semua pemanggil di bawah tidak perlu tahu/berubah.
 */
export function useCurrentUser(): CurrentUser {
  return useCurrentUserContext();
}
