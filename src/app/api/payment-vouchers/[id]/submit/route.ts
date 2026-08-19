import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { transitionPaymentVoucher } from "@/lib/transition-payment-voucher";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /payment-vouchers/:id/submit - draft -> submitted
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.PV_VIEW);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  return transitionPaymentVoucher(
    id,
    "draft",
    "submitted",
    "Hanya Payment Voucher berstatus Draft yang bisa diajukan.",
    auth.user.name
  );
}
