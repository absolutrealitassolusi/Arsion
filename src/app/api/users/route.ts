import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, roles, userRoles } from "@/db/schema";
import { flattenRoles } from "@/db/flatten-roles";
import { getUserWithRoles, setUserRoles } from "@/db/user-roles-helpers";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { serializeUser } from "@/lib/serialize-user";
import { logActivity } from "@/lib/activity-log";
import { createUserSchema } from "@/schemas/user.schema";
import { PERMISSIONS } from "@/config/permissions";
import type { UserStatus } from "@/types/user";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const department = searchParams.get("department");
  const role = searchParams.get("role");
  const status = searchParams.get("status") as UserStatus | null;

  let userIdsWithRole: string[] | undefined;
  if (role) {
    const matching = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(roles.name, role));
    userIdsWithRole = matching.map((m) => m.userId);
  }

  const conditions = [
    search ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined,
    department ? eq(users.department, department) : undefined,
    status ? eq(users.status, status) : undefined,
    userIdsWithRole ? inArray(users.id, userIdsWithRole) : undefined,
  ].filter((c) => c !== undefined);

  const rows = await db.query.users.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { userRoles: { with: { role: true } } },
    orderBy: desc(users.createdAt),
  });

  const data = rows.map((row) => serializeUser(flattenRoles(row)));
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.USER_MGMT_USERS);
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { password, roles: roleNames, ...rest } = parsed.data;

  const [existing] = await db.select().from(users).where(eq(users.email, rest.email)).limit(1);
  if (existing) {
    return NextResponse.json({ message: "Email sudah dipakai user lain." }, { status: 409 });
  }

  // Identitas & password dikelola Supabase Auth sekarang - lihat src/lib/current-user.ts.
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: rest.email,
    password,
    email_confirm: true,
  });
  if (authError || !authData.user) {
    return NextResponse.json(
      { message: `Gagal bikin akun login: ${authError?.message ?? "unknown error"}` },
      { status: 500 }
    );
  }

  const [created] = await db
    .insert(users)
    .values({ ...rest, authUserId: authData.user.id })
    .returning();
  await setUserRoles(created!.id, roleNames);
  const user = await getUserWithRoles(created!.id);

  await logActivity(auth.user.name, "Tambah User", `${created!.name} (${created!.email})`);

  return NextResponse.json({ data: serializeUser(user!) }, { status: 201 });
}
