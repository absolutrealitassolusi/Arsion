import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { logActivity } from "@/lib/activity-log";
import { loginSchema } from "@/schemas/auth.schema";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError || !authData.user) {
    return NextResponse.json({ message: "Email atau password salah." }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.authUserId, authData.user.id)).limit(1);
  if (!user || user.status !== "active") {
    await supabase.auth.signOut();
    return NextResponse.json({ message: "Email atau password salah." }, { status: 401 });
  }

  await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));
  await logActivity(user.name, "Login", "Masuk ke sistem");

  return NextResponse.json({ data: { email: user.email } });
}
