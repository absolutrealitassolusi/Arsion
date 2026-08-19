import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getUserWithRoles } from "@/db/user-roles-helpers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Permission } from "@/config/permissions";
import type { CurrentUser } from "@/types/auth";

/**
 * Resolve user yang lagi login dari session Supabase Auth - null kalau
 * belum login, session invalid/expired, user-nya belum ke-link (belum
 * dimigrasi - lihat src/db/migrate-users-to-supabase-auth.ts), atau
 * user-nya sudah dinonaktifkan (deactivate langsung ngunci akses meskipun
 * session Supabase-nya masih valid).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.authUserId, authUser.id)).limit(1);
  if (!row) return null;

  const user = await getUserWithRoles(row.id);
  if (!user || user.status !== "active") return null;

  const permissions = Array.from(new Set(user.roles.flatMap((role) => role.permissions))) as Permission[];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleNames: user.roles.map((role) => role.name),
    permissions,
  };
}
