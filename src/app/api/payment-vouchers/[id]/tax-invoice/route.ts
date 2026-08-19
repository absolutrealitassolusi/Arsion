import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";
import { requirePermission } from "@/lib/api-auth";
import { serializePaymentVoucher } from "@/lib/serialize-payment-voucher";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /payment-vouchers/:id/tax-invoice - cuma boleh kalau sudah "paid"
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.PV_PAY);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [current] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, id)).limit(1);
  if (!current) {
    return NextResponse.json({ message: "Payment Voucher tidak ditemukan" }, { status: 404 });
  }
  if (current.status !== "paid") {
    return NextResponse.json(
      { message: "Faktur Pajak cuma bisa diisi setelah Payment Voucher dibayar." },
      { status: 400 }
    );
  }

  const body = (await request.json()) as {
    taxInvoiceNumber: string;
    taxProofFileName?: string | null;
    taxProofUrls?: string[] | null;
  };

  const [updated] = await db
    .update(paymentVouchers)
    .set({
      taxInvoiceNumber: body.taxInvoiceNumber,
      ...(body.taxProofFileName !== undefined ? { taxProofFileName: body.taxProofFileName } : {}),
      ...(body.taxProofUrls !== undefined ? { taxProofUrls: body.taxProofUrls ?? [] } : {}),
    })
    .where(eq(paymentVouchers.id, id))
    .returning();

  return NextResponse.json({ data: serializePaymentVoucher(updated!) });
}
