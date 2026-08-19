import type { User as ApiUser, UserStatus } from "@/types/user";

interface PrismaUserWithRoles {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: UserStatus;
  lastLogin: Date | null;
  signatureUrl: string | null;
  signatureFileName: string | null;
  signatureUpdatedAt: Date | null;
  updatedAt: Date;
  roles: { name: string }[];
}

/** Prisma -> kontrak API (`roles` jadi array nama, tanggal jadi ISO string, `passwordHash` gak pernah ikut). */
export function serializeUser(user: PrismaUserWithRoles): ApiUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    position: user.position,
    roles: user.roles.map((role) => role.name),
    status: user.status,
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    updatedAt: user.updatedAt.toISOString(),
    signatureUrl: user.signatureUrl,
    signatureFileName: user.signatureFileName,
    signatureUpdatedAt: user.signatureUpdatedAt ? user.signatureUpdatedAt.toISOString() : null,
  };
}
