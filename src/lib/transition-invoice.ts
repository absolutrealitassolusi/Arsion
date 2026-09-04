import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, notifications } from "@/db/schema";
import { serializeInvoice } from "@/lib/serialize-invoice";
import { logActivity } from "@/lib/activity-log";
import type { InvoiceStatus } from "@/types/invoice";

const ACTIVITY_ACTION_FOR: Partial<Record<InvoiceStatus, string>> = {
  sent: "Kirim Invoice",
  paid: "Tandai Invoice Lunas",
};

function notificationCopyFor(newStatus: InvoiceStatus, invoice: { invoiceNumber: string; customerName: string }, by: string) {
  switch (newStatus) {
    case "sent":
      return {
        title: "Invoice terkirim",
        description: `${invoice.invoiceNumber} (${invoice.customerName}) ditandai terkirim oleh ${by}.`,
        type: "info" as const,
      };
    case "paid":
      return {
        title: "Invoice lunas",
        description: `${invoice.invoiceNumber} (${invoice.customerName}) ditandai lunas oleh ${by}.`,
        type: "success" as const,
      };
    default:
      return null;
  }
}

/**
 * Handler bersama buat transisi status Invoice (send/pay) - port dari pola
 * transitionPaymentVoucher() (src/lib/transition-payment-voucher.ts), tapi
 * lebih simpel: gak ada snapshot tanda tangan (Invoice gak punya blok
 * approval/tanda tangan sama sekali).
 */
export async function transitionInvoice(
  id: string,
  requiredStatus: InvoiceStatus,
  newStatus: InvoiceStatus,
  errorMessage: string,
  by: string
): Promise<NextResponse> {
  const [current] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!current) {
    return NextResponse.json({ message: "Invoice tidak ditemukan" }, { status: 404 });
  }
  if (current.status !== requiredStatus) {
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }

  const history = [...current.history, { status: newStatus, by, at: new Date().toISOString() }];

  const [updated] = await db
    .update(invoices)
    .set({ status: newStatus, history })
    .where(eq(invoices.id, id))
    .returning();

  const notificationCopy = notificationCopyFor(newStatus, current, by);
  if (notificationCopy) {
    await db.insert(notifications).values(notificationCopy).catch((err: unknown) => {
      console.error("Gagal membuat notifikasi buat transisi Invoice:", err);
    });
  }

  const activityAction = ACTIVITY_ACTION_FOR[newStatus];
  if (activityAction) {
    await logActivity(by, activityAction, `${current.invoiceNumber} (${current.customerName})`);
  }

  return NextResponse.json({ data: serializeInvoice(updated!) });
}
