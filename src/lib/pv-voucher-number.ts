import { and, eq, like, sql } from "drizzle-orm";
import { company, paymentVouchers, pvCounters } from "@/db/schema";
import type { db as Db, DbTransaction } from "@/lib/db";

export type PvResetMode = "monthly" | "yearly" | "never";

export interface PvNumberingSettings {
  code: string;
  seqLength: number;
  resetMode: PvResetMode;
}

export const DEFAULT_PV_NUMBERING: PvNumberingSettings = { code: "45", seqLength: 4, resetMode: "monthly" };

type Executor = typeof Db | DbTransaction;

/** Kunci periode counter - kapan nomor urut balik ke 0001. dateStr formatnya "YYYY-MM-DD". */
export function periodKeyFor(dateStr: string, resetMode: PvResetMode): string {
  const yy = dateStr.slice(2, 4);
  const mm = dateStr.slice(5, 7);
  if (resetMode === "monthly") return `${yy}${mm}`;
  if (resetMode === "yearly") return yy;
  return "all";
}

/** Pola LIKE buat semua nomor PV yang masuk satu periode (kode cuma digit, jadi aman dari wildcard). */
function idPatternFor(dateStr: string, settings: PvNumberingSettings): string {
  const yy = dateStr.slice(2, 4);
  const mm = dateStr.slice(5, 7);
  if (settings.resetMode === "monthly") return `${yy}${mm}${settings.code}%`;
  if (settings.resetMode === "yearly") return `${yy}__${settings.code}%`;
  return `____${settings.code}%`;
}

/** Nomor PV = YYMM (dari tanggal PV, bukan tanggal sistem) + kode + nomor urut. */
export function formatVoucherNumber(dateStr: string, settings: PvNumberingSettings, seq: number): string {
  return `${dateStr.slice(2, 4)}${dateStr.slice(5, 7)}${settings.code}${String(seq).padStart(settings.seqLength, "0")}`;
}

export async function loadNumberingSettings(executor: Executor): Promise<PvNumberingSettings> {
  const [row] = await executor
    .select({ code: company.pvCode, seqLength: company.pvSeqLength, resetMode: company.pvResetMode })
    .from(company)
    .limit(1);
  return row ?? DEFAULT_PV_NUMBERING;
}

/**
 * Nomor urut terbesar yang SUDAH dipakai PV di periode ini. Jaga-jaga kalau
 * counter ketinggalan dari data asli (PV lama dari sebelum tabel counter ada,
 * atau habis ganti mode reset) - counter selalu naik dari MAX(counter, nomor
 * terbesar yang ada), jadi gak mungkin nabrak PV lama.
 */
async function maxExistingSeq(executor: Executor, dateStr: string, settings: PvNumberingSettings): Promise<number> {
  // voucherNumber = id (lihat src/db/schema.ts) - scan kolom id.
  const rows = await executor
    .select({ id: paymentVouchers.id })
    .from(paymentVouchers)
    .where(like(paymentVouchers.id, idPatternFor(dateStr, settings)));
  const offset = 4 + settings.code.length;
  return rows.reduce((max, v) => {
    const seq = Number(v.id.slice(offset));
    return Number.isInteger(seq) ? Math.max(max, seq) : max;
  }, 0);
}

/**
 * Ambil nomor PV berikutnya DAN naikkan counter-nya. Wajib dipanggil di dalam
 * `db.transaction` yang sama dengan insert PV-nya, supaya kalau insert gagal
 * kenaikan counter ikut di-rollback.
 *
 * Counter di-upsert pakai INSERT ... ON CONFLICT DO UPDATE - dua PV yang
 * disimpan bersamaan antre di row lock counter yang sama, jadi gak bisa dapat
 * nomor kembar. Counter cuma naik: nomor PV Draft yang dihapus gak dipakai
 * ulang. PV In & PV Out berbagi satu urutan.
 */
export async function nextVoucherNumber(tx: DbTransaction, dateStr: string): Promise<string> {
  const settings = await loadNumberingSettings(tx);
  const period = periodKeyFor(dateStr, settings.resetMode);
  const existingMax = await maxExistingSeq(tx, dateStr, settings);

  const [row] = await tx
    .insert(pvCounters)
    .values({ period, code: settings.code, counter: existingMax + 1 })
    .onConflictDoUpdate({
      target: [pvCounters.period, pvCounters.code],
      set: { counter: sql`GREATEST(${pvCounters.counter}, ${existingMax}) + 1`, updatedAt: new Date() },
    })
    .returning({ counter: pvCounters.counter });

  return formatVoucherNumber(dateStr, settings, row!.counter);
}

/** Perkiraan nomor PV berikutnya buat ditampilkan di form - TIDAK menaikkan counter. */
export async function peekVoucherNumber(executor: Executor, dateStr: string): Promise<string> {
  const settings = await loadNumberingSettings(executor);
  const period = periodKeyFor(dateStr, settings.resetMode);
  const existingMax = await maxExistingSeq(executor, dateStr, settings);
  const [row] = await executor
    .select({ counter: pvCounters.counter })
    .from(pvCounters)
    .where(and(eq(pvCounters.period, period), eq(pvCounters.code, settings.code)))
    .limit(1);
  return formatVoucherNumber(dateStr, settings, Math.max(row?.counter ?? 0, existingMax) + 1);
}
