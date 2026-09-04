import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeInvoice } from "@/lib/serialize-invoice";
import { logActivity } from "@/lib/activity-log";
import { nextInvoiceNumber } from "@/lib/next-invoice-number";
import { invoiceSchema } from "@/schemas/invoice.schema";
import { PERMISSIONS } from "@/config/permissions";
import { calculateInvoiceTotals } from "@/types/invoice";
import type { InvoiceStatus } from "@/types/invoice";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") as InvoiceStatus | null;

  const conditions = [
    status ? eq(invoices.status, status) : undefined,
    search
      ? or(ilike(invoices.invoiceNumber, `%${search}%`), ilike(invoices.customerName, `%${search}%`))
      : undefined,
  ].filter((c) => c !== undefined);

  const rows = await db
    .select()
    .from(invoices)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(invoices.createdAt));

  const data = rows.map((row) => serializeInvoice(row));
  return NextResponse.json({ data, total: data.length });
}

// POST /invoices - selalu masuk sebagai status "draft"
export async function POST(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.FINANCE_INVOICE);
  if ("error" in auth) return auth.error;

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
  const now = new Date();

  const invoice = await db.transaction(async (tx) => {
    // Sama kaya src/app/api/payment-vouchers/route.ts - koneksi ke Supabase
    // (region Korea) kadang lambat, statement_timeout default 5 detik
    // dinaikkan biar ada ruang napas.
    await tx.execute(sql`SET LOCAL statement_timeout = 15000`);
    const invoiceNumber = await nextInvoiceNumber(tx, payload.date);
    const [created] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        customerName: payload.customerName,
        date: new Date(payload.date),
        dueDate: new Date(payload.dueDate),
        items: payload.items,
        ppnPercent: payload.ppnPercent,
        ...totals,
        notes: payload.notes || null,
        status: "draft",
        preparedBy: auth.user.name,
        history: [{ status: "draft", by: auth.user.name, at: now.toISOString() }],
      })
      .returning();
    return created!;
  });

  await logActivity(auth.user.name, "Buat Invoice", `${invoice.invoiceNumber} (${invoice.customerName})`);

  return NextResponse.json({ data: serializeInvoice(invoice) }, { status: 201 });
}
