import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendors } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeVendor } from "@/lib/serialize-vendor";
import { logActivity } from "@/lib/activity-log";
import { vendorSchema } from "@/schemas/vendor.schema";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!vendor) {
    return NextResponse.json({ message: "Vendor tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: serializeVendor(vendor) });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_VENDOR);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = vendorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Vendor tidak ditemukan" }, { status: 404 });
  }

  const [codeTaken] = await db
    .select()
    .from(vendors)
    .where(and(eq(vendors.code, parsed.data.code), ne(vendors.id, id)))
    .limit(1);
  if (codeTaken) {
    return NextResponse.json({ message: "Kode vendor sudah dipakai." }, { status: 409 });
  }

  const [vendor] = await db.update(vendors).set(parsed.data).where(eq(vendors.id, id)).returning();
  await logActivity(auth.user.name, "Edit Vendor", `${vendor!.name} (${vendor!.code})`);
  return NextResponse.json({ data: serializeVendor(vendor!) });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_VENDOR);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [existing] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Vendor tidak ditemukan" }, { status: 404 });
  }

  await db.delete(vendors).where(eq(vendors.id, id));
  await logActivity(auth.user.name, "Hapus Vendor", `${existing.name} (${existing.code})`);
  return NextResponse.json({ message: "Vendor berhasil dihapus" });
}
