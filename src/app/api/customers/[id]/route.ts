import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeCustomer } from "@/lib/serialize-customer";
import { logActivity } from "@/lib/activity-log";
import { customerSchema } from "@/schemas/customer.schema";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) {
    return NextResponse.json({ message: "Customer tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: serializeCustomer(customer) });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_CUSTOMER);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Customer tidak ditemukan" }, { status: 404 });
  }

  const [codeTaken] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, parsed.data.code), ne(customers.id, id)))
    .limit(1);
  if (codeTaken) {
    return NextResponse.json({ message: "Kode customer sudah dipakai." }, { status: 409 });
  }

  const { code, ...rest } = parsed.data;
  const [customer] = await db.update(customers).set({ ...rest, id: code }).where(eq(customers.id, id)).returning();
  await logActivity(auth.user.name, "Edit Customer", `${customer!.name} (${customer!.id})`);
  return NextResponse.json({ data: serializeCustomer(customer!) });
}

// Customer gak pernah di-hard-delete (bisa masih disebut di Invoice lama
// lewat nama teks, bukan FK - hapus permanen bikin riwayat transaksi lama
// kehilangan makna referensinya). "Hapus" di UI = nonaktifkan.
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_CUSTOMER);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [existing] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Customer tidak ditemukan" }, { status: 404 });
  }

  await db.update(customers).set({ status: "inactive" }).where(eq(customers.id, id));
  await logActivity(auth.user.name, "Nonaktifkan Customer", `${existing.name} (${existing.id})`);
  return NextResponse.json({ message: "Customer berhasil dinonaktifkan" });
}

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_CUSTOMER);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [existing] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Customer tidak ditemukan" }, { status: 404 });
  }

  await db.update(customers).set({ status: "active" }).where(eq(customers.id, id));
  await logActivity(auth.user.name, "Aktifkan Customer", `${existing.name} (${existing.id})`);
  return NextResponse.json({ message: "Customer berhasil diaktifkan" });
}
