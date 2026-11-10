import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { transitionPaymentVoucher } from "@/lib/transition-payment-voucher";
import { flattenPvFiles } from "@/lib/pv-files";
import { markPaidSchema } from "@/schemas/payment-voucher.schema";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /payment-vouchers/:id/pay - approved -> paid. Bukti pembayaran wajib
// ikut dikirim: "Tanggal Dibayar" (paidAt) = saat bukti pembayaran di-upload,
// diisi sekali di sini dan gak berubah lagi walau PV diubah belakangan.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.PV_PAY);
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = markPaidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Upload minimal 1 bukti pembayaran dulu.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { paymentProofs, paymentNote } = parsed.data;
  const flattened = flattenPvFiles(paymentProofs);
  const { id } = await params;
  return transitionPaymentVoucher(
    id,
    "approved",
    "paid",
    "Hanya Payment Voucher berstatus Disetujui yang bisa ditandai dibayar.",
    auth.user.name,
    {
      paidBy: auth.user.name,
      paidAt: new Date(),
      paymentNote: paymentNote || null,
      paymentProofs,
      paymentProofFileName: flattened.name,
      paymentProofUrls: flattened.urls,
    }
  );
}
