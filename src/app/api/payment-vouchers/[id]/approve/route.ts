import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { transitionPaymentVoucher } from "@/lib/transition-payment-voucher";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /payment-vouchers/:id/approve - submitted -> approved
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.PV_APPROVE);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  return transitionPaymentVoucher(
    id,
    "submitted",
    "approved",
    "Hanya Payment Voucher berstatus Menunggu Approval yang bisa disetujui.",
    auth.user.name,
    { approvedBy: auth.user.name }
  );
}
