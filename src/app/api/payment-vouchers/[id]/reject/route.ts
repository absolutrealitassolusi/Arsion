import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { transitionPaymentVoucher } from "@/lib/transition-payment-voucher";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /payment-vouchers/:id/reject - submitted -> rejected.
// Alasan wajib diisi (bukan cuma di UI) - pembuat PV butuh tahu apa yang
// harus diperbaiki sebelum mengajukan ulang.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.PV_APPROVE);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { note?: string };
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!note) {
    return NextResponse.json({ message: "Alasan penolakan wajib diisi." }, { status: 400 });
  }

  return transitionPaymentVoucher(
    id,
    "submitted",
    "rejected",
    "Hanya Payment Voucher berstatus Menunggu Approval yang bisa ditolak.",
    auth.user.name,
    undefined,
    note
  );
}
