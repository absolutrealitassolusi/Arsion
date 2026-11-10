import { NextResponse } from "next/server";
import { count, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";
import { requireUser } from "@/lib/api-auth";
import type { PvStatusCounts } from "@/types/payment-voucher";

// GET /payment-vouchers/status-counts - jumlah PV di antrian Approval
// (submitted) & Payment (approved), buat angka di menu samping. Query
// COUNT ringan, bukan narik seluruh list PV.
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const rows = await db
    .select({ status: paymentVouchers.status, total: count() })
    .from(paymentVouchers)
    .where(inArray(paymentVouchers.status, ["submitted", "approved"]))
    .groupBy(paymentVouchers.status);

  const data: PvStatusCounts = { submitted: 0, approved: 0 };
  for (const row of rows) {
    if (row.status === "submitted" || row.status === "approved") data[row.status] = Number(row.total);
  }
  return NextResponse.json({ data });
}
