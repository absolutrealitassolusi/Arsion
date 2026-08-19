import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { requireUser } from "@/lib/api-auth";
import { profileSchema } from "@/schemas/profile.schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Belum login." }, { status: 401 });
  }
  return NextResponse.json({ data: user });
}

/**
 * Self-service - user cuma boleh ubah nama & email DIRINYA SENDIRI (bukan
 * user lain, bukan role/status - itu lewat User Management yang butuh
 * permission `user-management.users`). Makanya cukup `requireUser()`.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [emailTaken] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, parsed.data.email), ne(users.id, auth.user.id)))
    .limit(1);
  if (emailTaken) {
    return NextResponse.json({ message: "Email sudah dipakai user lain." }, { status: 409 });
  }

  await db
    .update(users)
    .set({ name: parsed.data.name, email: parsed.data.email })
    .where(eq(users.id, auth.user.id));

  const user = await getCurrentUser();
  return NextResponse.json({ data: user });
}
