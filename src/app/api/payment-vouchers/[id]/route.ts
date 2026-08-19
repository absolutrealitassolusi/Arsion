import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers, users } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializePaymentVoucher } from "@/lib/serialize-payment-voucher";
import { logActivity } from "@/lib/activity-log";
import { paymentVoucherSchema } from "@/schemas/payment-voucher.schema";
import { PERMISSIONS } from "@/config/permissions";
import { calculatePvTotals } from "@/types/payment-voucher";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [voucher] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, id)).limit(1);
  if (!voucher) {
    return NextResponse.json({ message: "Payment Voucher tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: serializePaymentVoucher(voucher) });
}

// PUT /payment-vouchers/:id - edit isi PV, cuma boleh kalau status Draft
// atau Ditolak, dan cuma sama pembuatnya sendiri. Setelah diedit, status
// selalu balik ke "draft" (baik yang tadinya udah draft maupun yang tadinya
// ditolak) - PV yang diedit wajib lewat alur submit/approval lagi dari awal.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.PV_VIEW);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [current] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, id)).limit(1);
  if (!current) {
    return NextResponse.json({ message: "Payment Voucher tidak ditemukan" }, { status: 404 });
  }
  if (!["draft", "rejected"].includes(current.status)) {
    return NextResponse.json(
      { message: "Cuma Payment Voucher berstatus Draft atau Ditolak yang bisa diedit." },
      { status: 400 }
    );
  }
  if (current.preparedBy !== auth.user.name) {
    return NextResponse.json(
      { message: "Cuma pembuat Payment Voucher ini yang bisa mengeditnya." },
      { status: 403 }
    );
  }

  const body: unknown = await request.json();
  const parsed = paymentVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const totals = calculatePvTotals(payload.items, {
    ppnPercent: payload.ppnPercent,
    pphJasaPercent: payload.pphJasaPercent,
    pphFreelancePercent: payload.pphFreelancePercent,
  });
  const now = new Date();
  // Refresh snapshot tanda tangan pembuat - PV diedit = tetap orang yang
  // sama (dicek di atas), tapi TTD-nya mungkin sudah beda dari waktu pertama
  // dibuat. Lihat src/types/user.ts.
  const [preparer] = await db.select({ signatureUrl: users.signatureUrl }).from(users).where(eq(users.id, auth.user.id)).limit(1);
  const history = [
    ...current.history,
    {
      status: "draft" as const,
      by: auth.user.name,
      at: now.toISOString(),
      note:
        current.status === "rejected"
          ? "PV yang ditolak diedit & disimpan ulang sebagai Draft"
          : "PV draft diedit",
    },
  ];

  const [updated] = await db
    .update(paymentVouchers)
    .set({
      date: new Date(payload.date),
      senderBank: payload.senderBank,
      partyName: payload.partyName,
      description: payload.description,
      items: payload.items,
      ppnPercent: payload.ppnPercent,
      pphJasaPercent: payload.pphJasaPercent,
      pphFreelancePercent: payload.pphFreelancePercent,
      ...totals,
      paymentMethod: payload.paymentMethod,
      receiverBankName: payload.receiverBankName ?? "",
      receiverAccountName: payload.receiverAccountName ?? "",
      receiverAccountNumber: payload.receiverAccountNumber ?? "",
      projectNumber: payload.projectNumber || null,
      poNumber: payload.poNumber || null,
      invoiceNumber: payload.invoiceNumber || null,
      taxInvoiceNumber: payload.taxInvoiceNumber || null,
      attachmentName: payload.attachmentName ?? null,
      attachmentUrls: payload.attachmentUrls ?? [],
      status: "draft",
      preparedSignatureSnapshot: preparer?.signatureUrl ?? null,
      history,
    })
    .where(eq(paymentVouchers.id, id))
    .returning();

  await logActivity(auth.user.name, "Edit PV", `${updated!.voucherNumber} (${updated!.partyName})`);

  return NextResponse.json({ data: serializePaymentVoucher(updated!) });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.PV_VIEW);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [existing] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Payment Voucher tidak ditemukan" }, { status: 404 });
  }

  await db.delete(paymentVouchers).where(eq(paymentVouchers.id, id));
  await logActivity(auth.user.name, "Hapus PV", `${existing.voucherNumber} (${existing.partyName})`);
  return NextResponse.json({ message: "Payment Voucher berhasil dihapus" });
}
