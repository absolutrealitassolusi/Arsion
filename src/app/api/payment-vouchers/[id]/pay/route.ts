import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { transitionPaymentVoucher } from "@/lib/transition-payment-voucher";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /payment-vouchers/:id/pay - approved -> paid
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.PV_PAY);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  return transitionPaymentVoucher(
    id,
    "approved",
    "paid",
    "Hanya Payment Voucher berstatus Disetujui yang bisa ditandai dibayar.",
    auth.user.name,
    { paidBy: auth.user.name }
  );
}
