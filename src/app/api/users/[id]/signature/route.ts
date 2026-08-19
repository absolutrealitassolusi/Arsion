import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getUserWithRoles } from "@/db/user-roles-helpers";
import { requireUser } from "@/lib/api-auth";
import { serializeUser } from "@/lib/serialize-user";
import { PERMISSIONS } from "@/config/permissions";

const signatureSchema = z.object({
  signatureUrl: z.string().nullable(),
  signatureFileName: z.string().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  // Boleh edit tanda tangan sendiri, atau tanda tangan siapapun kalau punya
  // izin kelola User (mis. admin bantuin upload-in tanda tangan user lain).
  const isSelf = auth.user.id === id;
  const canManageUsers = auth.user.permissions.includes(PERMISSIONS.USER_MGMT_USERS);
  if (!isSelf && !canManageUsers) {
    return NextResponse.json({ message: "Kamu tidak punya izin untuk aksi ini." }, { status: 403 });
  }

  const body: unknown = await request.json();
  const parsed = signatureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
  }

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
  }

  const { signatureUrl, signatureFileName } = parsed.data;
  await db
    .update(users)
    .set({
      signatureUrl,
      signatureFileName,
      signatureUpdatedAt: signatureUrl ? new Date() : null,
    })
    .where(eq(users.id, id));
  const user = await getUserWithRoles(id);

  return NextResponse.json({ data: serializeUser(user!) });
}
