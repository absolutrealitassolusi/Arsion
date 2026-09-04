import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeInvoice } from "@/lib/serialize-invoice";
import { logActivity } from "@/lib/activity-log";
import { invoiceSchema } from "@/schemas/invoice.schema";
import { PERMISSIONS } from "@/config/permissions";
import { calculateInvoiceTotals } from "@/types/invoice";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!invoice) {
    return NextResponse.json({ message: "Invoice tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: serializeInvoice(invoice) });
}

// PUT /invoices/:id - edit isi invoice, cuma boleh kalau statusnya masih Draft.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.FINANCE_INVOICE);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [current] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!current) {
    return NextResponse.json({ message: "Invoice tidak ditemukan" }, { status: 404 });
  }
  if (current.status !== "draft") {
    return NextResponse.json({ message: "Cuma Invoice berstatus Draft yang bisa diedit." }, { status: 400 });
  }

  const body: unknown = await request.json();
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const totals = calculateInvoiceTotals(payload.items, payload.ppnPercent);

  const [updated] = await db
    .update(invoices)
    .set({
      customerName: payload.customerName,
      date: new Date(payload.date),
      dueDate: new Date(payload.dueDate),
      items: payload.items,
      ppnPercent: payload.ppnPercent,
      ...totals,
      notes: payload.notes || null,
    })
    .where(eq(invoices.id, id))
    .returning();

  await logActivity(auth.user.name, "Edit Invoice", `${updated!.invoiceNumber} (${updated!.customerName})`);

  return NextResponse.json({ data: serializeInvoice(updated!) });
}

// DELETE /invoices/:id - cuma boleh kalau statusnya masih Draft.
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.FINANCE_INVOICE);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [existing] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Invoice tidak ditemukan" }, { status: 404 });
  }
  if (existing.status !== "draft") {
    return NextResponse.json({ message: "Cuma Invoice berstatus Draft yang bisa dihapus." }, { status: 400 });
  }

  await db.delete(invoices).where(eq(invoices.id, id));
  await logActivity(auth.user.name, "Hapus Invoice", `${existing.invoiceNumber} (${existing.customerName})`);
  return NextResponse.json({ message: "Invoice berhasil dihapus" });
}
