import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq, ilike } from "drizzle-orm";
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

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const rows = await db.query.roles.findMany({
    where: search ? ilike(roles.name, `%${search}%`) : undefined,
    with: { userRoles: true },
    orderBy: asc(roles.createdAt),
  });

  const data = rows.map((role) => serializeRole({ ...role, _count: { users: role.userRoles.length } }));
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.USER_MGMT_ROLES);
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json();
  const parsed = rolePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(roles).where(eq(roles.name, parsed.data.name)).limit(1);
  if (existing) {
    return NextResponse.json({ message: "Nama role sudah dipakai." }, { status: 409 });
  }

  const [role] = await db.insert(roles).values(parsed.data).returning();

  await logActivity(auth.user.name, "Tambah Role", role!.name);

  return NextResponse.json({ data: serializeRole({ ...role!, _count: { users: 0 } }) }, { status: 201 });
}
