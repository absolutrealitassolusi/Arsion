import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/api-auth";
import { serializeNotification } from "@/lib/serialize-notification";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /notifications/:id/read
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [existing] = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Notifikasi tidak ditemukan" }, { status: 404 });
  }

  const [updated] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
  return NextResponse.json({ data: serializeNotification(updated!) });
}
