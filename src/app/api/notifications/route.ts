import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/api-auth";
import { serializeNotification } from "@/lib/serialize-notification";

// GET /notifications - daftar global, belum di-scope per user (sama kaya mock).
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  return NextResponse.json({ data: rows.map(serializeNotification) });
}
