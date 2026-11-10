import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/api-auth";
import { peekVoucherNumber } from "@/lib/pv-voucher-number";
import { todayInJakarta } from "@/schemas/payment-voucher.schema";
import { PERMISSIONS } from "@/config/permissions";

// GET /payment-vouchers/next-number?date=YYYY-MM-DD - perkiraan nomor PV
// berikutnya buat ditampilkan di form. TIDAK menaikkan counter; nomor final
// tetap baru ditentukan pas POST /payment-vouchers (bisa beda kalau ada
// orang lain yang simpan PV duluan).
export async function GET(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.PV_VIEW);
  if ("error" in auth) return auth.error;

  const date = new URL(request.url).searchParams.get("date") ?? todayInJakarta();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ message: "Format tanggal tidak valid" }, { status: 400 });
  }
  if (date > todayInJakarta()) {
    return NextResponse.json({ message: "Tanggal PV tidak boleh lebih maju dari hari ini" }, { status: 400 });
  }

  const voucherNumber = await peekVoucherNumber(db, date);
  return NextResponse.json({ data: { voucherNumber, isPreview: true } });
}
