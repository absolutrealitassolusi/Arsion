import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getUserWithRoles, setUserRoles } from "@/db/user-roles-helpers";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeUser } from "@/lib/serialize-user";
import { logActivity } from "@/lib/activity-log";
import { userSchema } from "@/schemas/user.schema";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const user = await getUserWithRoles(id);
  if (!user) {
    return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: serializeUser(user) });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.USER_MGMT_USERS);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
  }

  const { roles: roleNames, ...rest } = parsed.data;
  await db.update(users).set(rest).where(eq(users.id, id));
  await setUserRoles(id, roleNames);
  const user = await getUserWithRoles(id);

  await logActivity(auth.user.name, "Edit User", `${existing.name} (${existing.email})`);

  return NextResponse.json({ data: serializeUser(user!) });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.USER_MGMT_USERS);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
  }

  await db.delete(users).where(eq(users.id, id));
  await logActivity(auth.user.name, "Hapus User", `${existing.name} (${existing.email})`);
  return NextResponse.json({ message: "User berhasil dihapus" });
}
