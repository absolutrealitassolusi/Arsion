import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { transitionInvoice } from "@/lib/transition-invoice";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /invoices/:id/send - draft -> sent
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.FINANCE_INVOICE);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  return transitionInvoice(id, "draft", "sent", "Hanya Invoice berstatus Draft yang bisa ditandai terkirim.", auth.user.name);
}
