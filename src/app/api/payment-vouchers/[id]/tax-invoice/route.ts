import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";
import { requirePermission } from "@/lib/api-auth";
import { serializePaymentVoucher } from "@/lib/serialize-payment-voucher";
import { flattenPvFiles } from "@/lib/pv-files";
import { taxDocumentsSchema } from "@/schemas/payment-voucher.schema";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /payment-vouchers/:id/tax-invoice - dokumen pajak (Faktur Pajak +
// Bukti Potong PPh + catatan), cuma boleh kalau sudah "paid". Isinya
// menggantikan seluruh dokumen pajak yang tersimpan.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.PV_PAY);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [current] = await db.select({ status: paymentVouchers.status }).from(paymentVouchers).where(eq(paymentVouchers.id, id)).limit(1);
  if (!current) {
    return NextResponse.json({ message: "Payment Voucher tidak ditemukan" }, { status: 404 });
  }
  if (current.status !== "paid") {
    return NextResponse.json(
      { message: "Dokumen pajak cuma bisa diisi setelah Payment Voucher dibayar." },
      { status: 400 }
    );
  }

  const parsed = taxDocumentsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { taxInvoiceNumber, taxProofs, withholdingProofs, taxNote } = parsed.data;
  // Kolom lama = gabungan Faktur + Bukti Potong, supaya cetak PV & ZIP ikut semuanya.
  const flattened = flattenPvFiles([...taxProofs, ...withholdingProofs]);
  const [updated] = await db
    .update(paymentVouchers)
    .set({
      taxInvoiceNumber,
      taxProofs,
      withholdingProofs,
      taxNote,
      taxProofFileName: flattened.name,
      taxProofUrls: flattened.urls,
    })
    .where(eq(paymentVouchers.id, id))
    .returning();

  return NextResponse.json({ data: serializePaymentVoucher(updated!) });
}
