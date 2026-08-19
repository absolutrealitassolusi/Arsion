import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers, users } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializePaymentVoucher } from "@/lib/serialize-payment-voucher";
import { logActivity } from "@/lib/activity-log";
import { nextVoucherNumber } from "@/lib/pv-voucher-number";
import { paymentVoucherSchema } from "@/schemas/payment-voucher.schema";
import { PERMISSIONS } from "@/config/permissions";
import { calculatePvTotals } from "@/types/payment-voucher";
import type { PvDirection, PvStatus } from "@/types/payment-voucher";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") as PvDirection | null;
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") as PvStatus | null;

  const conditions = [
    direction ? eq(paymentVouchers.direction, direction) : undefined,
    status ? eq(paymentVouchers.status, status) : undefined,
    search
      ? or(ilike(paymentVouchers.voucherNumber, `%${search}%`), ilike(paymentVouchers.partyName, `%${search}%`))
      : undefined,
  ].filter((c) => c !== undefined);

  // Kolom attachment (base64 data URLs, bisa ratusan KB - MB per voucher)
  // sengaja DIKECUALIKAN dari list ini - gak ada satupun tampilan yang
  // pakai list ini (table, worklist, archive, report, dashboard) yang
  // nampilin lampiran/bukti, cuma halaman detail (GET by id) yang perlu.
  // Nge-select semua kolom di sini bikin list PV jadi lambat banget waktu
  // datanya udah banyak (SELECT * narik semua base64 itu tiap kali).
  const rows = await db
    .select({
      id: paymentVouchers.id,
      voucherNumber: paymentVouchers.voucherNumber,
      direction: paymentVouchers.direction,
      date: paymentVouchers.date,
      senderBank: paymentVouchers.senderBank,
      partyName: paymentVouchers.partyName,
      description: paymentVouchers.description,
      items: paymentVouchers.items,
      ppnPercent: paymentVouchers.ppnPercent,
      pphJasaPercent: paymentVouchers.pphJasaPercent,
      pphFreelancePercent: paymentVouchers.pphFreelancePercent,
      subtotal: paymentVouchers.subtotal,
      ppnAmount: paymentVouchers.ppnAmount,
      pphJasaAmount: paymentVouchers.pphJasaAmount,
      pphFreelanceAmount: paymentVouchers.pphFreelanceAmount,
      totalAmount: paymentVouchers.totalAmount,
      paymentMethod: paymentVouchers.paymentMethod,
      receiverBankName: paymentVouchers.receiverBankName,
      receiverAccountName: paymentVouchers.receiverAccountName,
      receiverAccountNumber: paymentVouchers.receiverAccountNumber,
      projectNumber: paymentVouchers.projectNumber,
      poNumber: paymentVouchers.poNumber,
      invoiceNumber: paymentVouchers.invoiceNumber,
      taxInvoiceNumber: paymentVouchers.taxInvoiceNumber,
      attachmentName: paymentVouchers.attachmentName,
      status: paymentVouchers.status,
      preparedBy: paymentVouchers.preparedBy,
      approvedBy: paymentVouchers.approvedBy,
      paidBy: paymentVouchers.paidBy,
      paymentProofFileName: paymentVouchers.paymentProofFileName,
      taxProofFileName: paymentVouchers.taxProofFileName,
      history: paymentVouchers.history,
      createdAt: paymentVouchers.createdAt,
      updatedAt: paymentVouchers.updatedAt,
    })
    .from(paymentVouchers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(paymentVouchers.createdAt));

  const data = rows.map((row) =>
    serializePaymentVoucher({
      ...row,
      attachmentUrls: [],
      paymentProofUrls: [],
      taxProofUrls: [],
      preparedSignatureSnapshot: null,
      approvedSignatureSnapshot: null,
      paidSignatureSnapshot: null,
    })
  );
  return NextResponse.json({ data, total: data.length });
}

// POST /payment-vouchers - selalu masuk sebagai status "draft"
export async function POST(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.PV_VIEW);
  if ("error" in auth) return auth.error;

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
  // Snapshot tanda tangan pembuat PERSIS di momen ini - lihat src/types/user.ts.
  const [preparer] = await db.select({ signatureUrl: users.signatureUrl }).from(users).where(eq(users.id, auth.user.id)).limit(1);

  const voucher = await db.transaction(async (tx) => {
    // Default 5 detik kadang kepotong kalau koneksi ke Supabase (region
    // Korea) lagi lambat - dinaikkan ke 15 detik biar ada ruang napas.
    await tx.execute(sql`SET LOCAL statement_timeout = 15000`);
    const voucherNumber = await nextVoucherNumber(tx, payload.date);
    const [created] = await tx
      .insert(paymentVouchers)
      .values({
        voucherNumber,
        direction: payload.direction,
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
        preparedBy: auth.user.name,
        preparedSignatureSnapshot: preparer?.signatureUrl ?? null,
        history: [{ status: "draft", by: auth.user.name, at: now.toISOString() }],
      })
      .returning();
    return created!;
  });

  await logActivity(auth.user.name, "Buat PV", `${voucher.voucherNumber} (${voucher.partyName})`);

  return NextResponse.json({ data: serializePaymentVoucher(voucher) }, { status: 201 });
}
