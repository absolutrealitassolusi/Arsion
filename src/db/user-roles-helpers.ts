import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, roles, userRoles } from "@/db/schema";
import { flattenRoles } from "@/db/flatten-roles";

/** User + roles dalam bentuk flat (`roles: Role[]`) - dipakai `serializeUser`. */
export async function getUserWithRoles(id: string) {
  const row = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { userRoles: { with: { role: true } } },
  });
  return row ? flattenRoles(row) : null;
}

/** Sama seperti `getUserWithRoles`, tapi dicari lewat authUserId (Supabase Auth) - dipakai `current-user.ts`. */
export async function getUserWithRolesByAuthId(authUserId: string) {
  const row = await db.query.users.findFirst({
    where: eq(users.authUserId, authUserId),
    with: { userRoles: { with: { role: true } } },
  });
  return row ? flattenRoles(row) : null;
}

/**
 * Ganti seluruh role sebuah user jadi persis nama-nama yang dikasih (pola
 * Prisma `roles: { connect: [...] }` / `{ set: [...] }` - resolve nama ->
 * id, hapus assignment lama, insert yang baru).
 */
export async function setUserRoles(userId: string, roleNames: string[]) {
  const roleRows = roleNames.length > 0 ? await db.select().from(roles).where(inArray(roles.name, roleNames)) : [];
  await db.delete(userRoles).where(eq(userRoles.userId, userId));
  if (roleRows.length > 0) {
    await db.insert(userRoles).values(roleRows.map((r) => ({ userId, roleId: r.id })));
  }
}
