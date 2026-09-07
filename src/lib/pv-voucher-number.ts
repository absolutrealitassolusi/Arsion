import { like } from "drizzle-orm";
import { paymentVouchers } from "@/db/schema";
import type { DbTransaction } from "@/lib/db";

function periodKeyFromDate(dateStr: string): string {
  // dateStr formatnya "YYYY-MM-DD"
  return `${dateStr.slice(2, 4)}${dateStr.slice(5, 7)}`;
}

/**
 * Nomor PV formatnya YYMM45XXXX - YY/MM ikut tanggal PV-nya sendiri, "45"
 * kode tetap, XXXX nomor urut gabungan (PV In & PV Out satu hitungan) yang
 * reset tiap ganti bulan. Ini port persis dari logic yang sama di
 * `src/mocks/mock-adapter.ts` (versi mock), bedanya sumber datanya scan
 * tabel DB, bukan array in-memory - dipanggil di dalam `db.transaction`
 * biar baca-max-lalu-insert-nya atomic (dua create bersamaan di periode yang
 * sama gak akan tabrakan nomor).
 */
export async function nextVoucherNumber(
  tx: DbTransaction,
  dateStr: string
): Promise<string> {
  const prefix = `${periodKeyFromDate(dateStr)}45`;
  // voucherNumber = id (lihat src/db/schema.ts, plan "Primary key dari
  // code/nomor") - scan kolom id, bukan kolom voucherNumber terpisah lagi.
  const existing = await tx
    .select({ id: paymentVouchers.id })
    .from(paymentVouchers)
    .where(like(paymentVouchers.id, `${prefix}%`));
  const maxSeq = existing.reduce(
    (max, v) => Math.max(max, Number(v.id.slice(prefix.length)) || 0),
    0
  );
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}
