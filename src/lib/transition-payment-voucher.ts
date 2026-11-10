import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers, notifications, users } from "@/db/schema";
import { serializePaymentVoucher } from "@/lib/serialize-payment-voucher";
import { logActivity } from "@/lib/activity-log";
import type { PvStatus } from "@/types/payment-voucher";
import type { NotificationType } from "@/types/notification";

const ACTIVITY_ACTION_FOR: Partial<Record<PvStatus, string>> = {
  submitted: "Ajukan PV",
  approved: "Approve PV",
  rejected: "Reject PV",
  paid: "Tandai PV Dibayar",
  cancelled: "Batalkan PV",
};

/** Kolom snapshot yang perlu diisi per status baru - null kalau status itu gak nampilin blok tanda tangan di cetakan. */
const SIGNATURE_SNAPSHOT_COLUMN: Partial<Record<PvStatus, "approvedSignatureSnapshot" | "paidSignatureSnapshot">> = {
  approved: "approvedSignatureSnapshot",
  paid: "paidSignatureSnapshot",
};

/**
 * Isi notifikasi buat tiap status baru - "draft" gak dapat notifikasi
 * (masih private punya pembuatnya, belum ada yang perlu tahu).
 */
function notificationCopyFor(
  newStatus: PvStatus,
  voucher: { id: string; partyName: string },
  by: string,
  note?: string
): { title: string; description: string; type: NotificationType } | null {
  switch (newStatus) {
    case "submitted":
      return {
        title: "Payment Voucher diajukan",
        description: `${voucher.id} (${voucher.partyName}) menunggu approval.`,
        type: "info",
      };
    case "approved":
      return {
        title: "Payment Voucher disetujui",
        description: `${voucher.id} (${voucher.partyName}) disetujui oleh ${by}.`,
        type: "success",
      };
    case "rejected":
      return {
        title: "Payment Voucher ditolak",
        description: `${voucher.id} (${voucher.partyName}) ditolak oleh ${by}${note ? ` - ${note}` : ""}.`,
        type: "warning",
      };
    case "paid":
      return {
        title: "Payment Voucher dibayar",
        description: `${voucher.id} (${voucher.partyName}) ditandai sudah dibayar oleh ${by}.`,
        type: "success",
      };
    case "cancelled":
      return {
        title: "Payment Voucher dibatalkan",
        description: `${voucher.id} (${voucher.partyName}) dibatalkan oleh ${by}${note ? ` - ${note}` : ""}.`,
        type: "warning",
      };
    default:
      return null;
  }
}

/**
 * Handler bersama buat 4 transisi status PV (submit/approve/reject/pay) -
 * port dari `transitionVoucher()` di src/mocks/mock-adapter.ts: cari
 * voucher, cek statusnya lagi status yang disyaratkan, tambah entri
 * history, simpan. `by` dan `extra` beda-beda tiap transisi (mis. `approve`
 * ngisi `approvedBy`, `reject` ngisi `note` di history). Tiap transisi
 * sukses juga bikin 1 entri di lonceng notifikasi - kalau ini gagal,
 * gak sampai bikin transisi PV-nya ikut gagal (notifikasi cuma efek
 * samping, bukan bagian dari data inti yang wajib konsisten).
 */
export async function transitionPaymentVoucher(
  id: string,
  requiredStatus: PvStatus | PvStatus[],
  newStatus: PvStatus,
  errorMessage: string,
  by: string,
  extra?: Partial<typeof paymentVouchers.$inferInsert>,
  note?: string
): Promise<NextResponse> {
  const [current] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, id)).limit(1);
  if (!current) {
    return NextResponse.json({ message: "Payment Voucher tidak ditemukan" }, { status: 404 });
  }
  const allowedStatuses = Array.isArray(requiredStatus) ? requiredStatus : [requiredStatus];
  if (!allowedStatuses.includes(current.status)) {
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }

  const history = [
    ...current.history,
    { status: newStatus, by, at: new Date().toISOString(), ...(note ? { note } : {}) },
  ];

  // Snapshot tanda tangan PERSIS di momen ini (bukan referensi live) - lihat
  // src/types/user.ts. Dicari by name, konsisten sama cara
  // payment-voucher-print.tsx sekarang mencocokkan signature ke user.
  const snapshotColumn = SIGNATURE_SNAPSHOT_COLUMN[newStatus];
  const signatureSnapshot: Partial<typeof paymentVouchers.$inferInsert> = {};
  if (snapshotColumn) {
    const [actingUser] = await db.select({ signatureUrl: users.signatureUrl }).from(users).where(eq(users.name, by)).limit(1);
    signatureSnapshot[snapshotColumn] = actingUser?.signatureUrl ?? null;
  }

  // `status = status lama` ikut jadi syarat UPDATE - kalau di sela cek di atas
  // dan update ini ada orang lain yang sudah mengubah status PV yang sama
  // (mis. dua approver klik barengan), update-nya gak kena row apapun dan
  // ditolak, bukan menimpa diam-diam.
  const [updated] = await db
    .update(paymentVouchers)
    .set({ ...extra, ...signatureSnapshot, status: newStatus, history })
    .where(and(eq(paymentVouchers.id, id), eq(paymentVouchers.status, current.status)))
    .returning();
  if (!updated) {
    return NextResponse.json(
      { message: "Status Payment Voucher ini baru saja diubah orang lain. Muat ulang halaman lalu coba lagi." },
      { status: 409 }
    );
  }

  const notificationCopy = notificationCopyFor(newStatus, current, by, note);
  if (notificationCopy) {
    await db.insert(notifications).values(notificationCopy).catch((err: unknown) => {
      console.error("Gagal membuat notifikasi buat transisi PV:", err);
    });
  }

  const activityAction = ACTIVITY_ACTION_FOR[newStatus];
  if (activityAction) {
    await logActivity(by, activityAction, `${current.id} (${current.partyName})`);
  }

  return NextResponse.json({ data: serializePaymentVoucher(updated) });
}
