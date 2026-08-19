import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getUserWithRoles } from "@/db/user-roles-helpers";
import { requirePermission } from "@/lib/api-auth";
import { serializeUser } from "@/lib/serialize-user";
import { logActivity } from "@/lib/activity-log";
import { PERMISSIONS } from "@/config/permissions";

const statusSchema = z.object({ status: z.enum(["active", "inactive"]) });

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.USER_MGMT_USERS);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
  }

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
  }

  await db.update(users).set({ status: parsed.data.status }).where(eq(users.id, id));
  const user = await getUserWithRoles(id);

  await logActivity(
    auth.user.name,
    parsed.data.status === "active" ? "Aktifkan User" : "Nonaktifkan User",
    `${existing.name} (${existing.email})`
  );

  return NextResponse.json({ data: serializeUser(user!) });
}
