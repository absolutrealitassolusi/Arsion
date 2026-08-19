import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { company } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeCompany } from "@/lib/serialize-company";
import { logActivity } from "@/lib/activity-log";
import { companySchema } from "@/schemas/company.schema";
import { PERMISSIONS } from "@/config/permissions";

// GET /company - singleton, gak ada [id] karena cuma ada 1 row.
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const [companyRow] = await db.select().from(company).limit(1);
  return NextResponse.json({ data: companyRow ? serializeCompany(companyRow) : null });
}

export async function PUT(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_COMPANY);
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json();
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Belum tentu row-nya udah ada (mis. kalau seed belum jalan) - update
  // kalau udah ada, create kalau belum, biar self-healing.
  const [existing] = await db.select().from(company).limit(1);
  const [companyRow] = existing
    ? await db.update(company).set(parsed.data).where(eq(company.id, existing.id)).returning()
    : await db.insert(company).values(parsed.data).returning();

  await logActivity(auth.user.name, "Edit Data Perusahaan", companyRow!.name);

  return NextResponse.json({ data: serializeCompany(companyRow!) });
}
