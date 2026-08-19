import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roles } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeRole } from "@/lib/serialize-role";
import { logActivity } from "@/lib/activity-log";
import { roleSchema } from "@/schemas/role.schema";
import { PERMISSIONS } from "@/config/permissions";

const rolePayloadSchema = roleSchema.extend({
  permissions: z.array(z.string()),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const role = await db.query.roles.findFirst({ where: eq(roles.id, id), with: { userRoles: true } });
  if (!role) {
    return NextResponse.json({ message: "Role tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: serializeRole({ ...role, _count: { users: role.userRoles.length } }) });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.USER_MGMT_ROLES);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = rolePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Role tidak ditemukan" }, { status: 404 });
  }

  await db.update(roles).set(parsed.data).where(eq(roles.id, id));
  const role = await db.query.roles.findFirst({ where: eq(roles.id, id), with: { userRoles: true } });

  await logActivity(auth.user.name, "Edit Role", role!.name);

  return NextResponse.json({ data: serializeRole({ ...role!, _count: { users: role!.userRoles.length } }) });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.USER_MGMT_ROLES);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [existing] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Role tidak ditemukan" }, { status: 404 });
  }

  await db.delete(roles).where(eq(roles.id, id));
  await logActivity(auth.user.name, "Hapus Role", existing.name);
  return NextResponse.json({ message: "Role berhasil dihapus" });
}
