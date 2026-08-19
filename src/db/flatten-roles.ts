/**
 * Drizzle's relational query API nests many-to-many results one level
 * deeper than Prisma's `include: { roles: true }` (`user.userRoles[].role`
 * vs the flat `user.roles[]` every serializer/caller expects) - this keeps
 * that flat shape so nothing downstream has to change.
 */
export function flattenRoles<T extends { userRoles: { role: unknown }[] }>(row: T) {
  const { userRoles, ...rest } = row;
  return { ...rest, roles: userRoles.map((ur) => ur.role) } as Omit<T, "userRoles"> & {
    roles: T["userRoles"][number]["role"][];
  };
}
