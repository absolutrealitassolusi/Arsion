import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs } from "@/db/schema";
import { requireUser } from "@/lib/api-auth";
import { serializeActivityLog } from "@/lib/serialize-activity-log";

// GET /activity-logs?actor=Nama - list global, atau di-scope ke 1 user (dipakai tab Activity Log di halaman detail User).
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const actor = searchParams.get("actor");

  const rows = await db
    .select()
    .from(activityLogs)
    .where(actor ? eq(activityLogs.actor, actor) : undefined)
    .orderBy(desc(activityLogs.createdAt))
    .limit(200);

  const data = rows.map(serializeActivityLog);
  return NextResponse.json({ data, total: data.length });
}
