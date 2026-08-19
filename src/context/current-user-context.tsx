"use client";

import { createContext, useContext } from "react";
import type { CurrentUser } from "@/types/auth";

const CurrentUserContext = createContext<CurrentUser | null>(null);

interface CurrentUserProviderProps {
  user: CurrentUser;
  children: React.ReactNode;
}

/**
 * User yang lagi login di-resolve sekali di server ((dashboard)/layout.tsx,
 * lewat getCurrentUser()) lalu dioper ke sini - jadi tidak ada fetch/loading
 * state di client sama sekali, semua consumer (useCurrentUser()) bisa baca
 * datanya secara synchronous persis kaya sebelumnya waktu masih mock.
 */
export function CurrentUserProvider({ user, children }: CurrentUserProviderProps) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUserContext(): CurrentUser {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUserContext harus dipakai di dalam <CurrentUserProvider>");
  return ctx;
}
