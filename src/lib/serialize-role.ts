import type { Role as ApiRole } from "@/types/role";

interface PrismaRoleWithCount {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  _count: { users: number };
}

/** Prisma -> kontrak API (`userCount` dihitung live dari relasi, bukan kolom tersimpan). */
export function serializeRole(role: PrismaRoleWithCount): ApiRole {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    userCount: role._count.users,
    permissions: role.permissions as ApiRole["permissions"],
  };
}
