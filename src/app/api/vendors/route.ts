import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendors } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeVendor } from "@/lib/serialize-vendor";
import { logActivity } from "@/lib/activity-log";
import { vendorSchema } from "@/schemas/vendor.schema";
import { PERMISSIONS } from "@/config/permissions";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const rows = await db
    .select()
    .from(vendors)
    .where(search ? or(ilike(vendors.name, `%${search}%`), ilike(vendors.id, `%${search}%`)) : undefined)
    .orderBy(desc(vendors.createdAt));

  const data = rows.map(serializeVendor);
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_VENDOR);
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json();
  const parsed = vendorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(vendors).where(eq(vendors.id, parsed.data.code)).limit(1);
  if (existing) {
    return NextResponse.json({ message: "Kode vendor sudah dipakai." }, { status: 409 });
  }

  const { code, ...rest } = parsed.data;
  const [vendor] = await db.insert(vendors).values({ ...rest, id: code }).returning();
  await logActivity(auth.user.name, "Tambah Vendor", `${vendor!.name} (${vendor!.id})`);
  return NextResponse.json({ data: serializeVendor(vendor!) }, { status: 201 });
}
