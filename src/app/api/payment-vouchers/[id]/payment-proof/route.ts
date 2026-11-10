import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";
import { requirePermission } from "@/lib/api-auth";
import { serializePaymentVoucher } from "@/lib/serialize-payment-voucher";
import { flattenPvFiles } from "@/lib/pv-files";
import { paymentProofSchema } from "@/schemas/payment-voucher.schema";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /payment-vouchers/:id/payment-proof - ganti/tambah bukti pembayaran &
// catatan setelah PV dibayar. Tanggal Dibayar (paidAt) TIDAK ikut berubah.
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
      { message: "Bukti pembayaran cuma bisa diisi setelah Payment Voucher dibayar." },
      { status: 400 }
    );
  }

  const parsed = paymentProofSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const flattened = flattenPvFiles(parsed.data.paymentProofs);
  const [updated] = await db
    .update(paymentVouchers)
    .set({
      paymentProofs: parsed.data.paymentProofs,
      paymentProofFileName: flattened.name,
      paymentProofUrls: flattened.urls,
      ...(parsed.data.paymentNote !== undefined ? { paymentNote: parsed.data.paymentNote || null } : {}),
    })
    .where(eq(paymentVouchers.id, id))
    .returning();

  return NextResponse.json({ data: serializePaymentVoucher(updated!) });
}
