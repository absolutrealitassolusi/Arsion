import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";
import { requireUser } from "@/lib/api-auth";
import { transitionPaymentVoucher } from "@/lib/transition-payment-voucher";
import { PERMISSIONS } from "@/config/permissions";
import { CANCELLABLE_PV_STATUSES } from "@/types/payment-voucher";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /payment-vouchers/:id/cancel - draft/submitted/approved/rejected -> cancelled.
// Boleh dilakukan pembuat PV-nya sendiri ATAU user dengan izin Approve.
// Alasan wajib diisi, disimpan di history. Nomor PV-nya tetap terpakai
// (gak dihapus), jadi jejak auditnya tetap ada.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { note?: string };
  const note = body.note?.trim();
  if (!note) {
    return NextResponse.json({ message: "Alasan pembatalan wajib diisi." }, { status: 400 });
  }

  const [current] = await db
    .select({ preparedBy: paymentVouchers.preparedBy })
    .from(paymentVouchers)
    .where(eq(paymentVouchers.id, id))
    .limit(1);
  if (!current) {
    return NextResponse.json({ message: "Payment Voucher tidak ditemukan" }, { status: 404 });
  }

  const isPreparer = current.preparedBy === auth.user.name;
  const canApprove = auth.user.permissions.includes(PERMISSIONS.PV_APPROVE);
  if (!isPreparer && !canApprove) {
    return NextResponse.json(
      { message: "Cuma pembuat PV atau user dengan izin Approve yang bisa membatalkan PV ini." },
      { status: 403 }
    );
  }

  return transitionPaymentVoucher(
    id,
    CANCELLABLE_PV_STATUSES,
    "cancelled",
    "Payment Voucher yang sudah dibayar atau sudah dibatalkan tidak bisa dibatalkan.",
    auth.user.name,
    undefined,
    note
  );
}
