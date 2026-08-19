import { db } from "@/lib/db";
import { activityLogs } from "@/db/schema";

/**
 * Catat 1 baris aktivitas - dipanggil dari Route Handler setelah aksi
 * utamanya sukses (create/edit/delete/transisi status, dst). Gagal nyatet
 * log TIDAK BOLEH bikin aksi utamanya ikut gagal (sama filosofinya kaya
 * notifikasi di transition-payment-voucher.ts) - makanya error di-swallow,
 * cuma di-console.error.
 */
export async function logActivity(actor: string, action: string, detail: string): Promise<void> {
  await db.insert(activityLogs).values({ actor, action, detail }).catch((err: unknown) => {
    console.error("Gagal mencatat activity log:", err);
  });
}
