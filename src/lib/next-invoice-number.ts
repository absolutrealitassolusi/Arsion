import { like } from "drizzle-orm";
import { invoices } from "@/db/schema";
import type { DbTransaction } from "@/lib/db";

function periodKeyFromDate(dateStr: string): string {
  // dateStr formatnya "YYYY-MM-DD"
  return `${dateStr.slice(2, 4)}${dateStr.slice(5, 7)}`;
}

/**
 * Nomor invoice formatnya INV/YYMM/XXXX - YY/MM ikut tanggal invoice-nya
 * sendiri, XXXX nomor urut yang reset tiap ganti bulan. Beda dari format PV
 * (YYMM45XXXX) supaya lebih gampang dibaca customer (lihat
 * src/lib/pv-voucher-number.ts buat pola aslinya) - dipanggil di dalam
 * `db.transaction` biar baca-max-lalu-insert-nya atomic.
 */
export async function nextInvoiceNumber(tx: DbTransaction, dateStr: string): Promise<string> {
  const prefix = `INV/${periodKeyFromDate(dateStr)}/`;
  const existing = await tx
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}%`));
  const maxSeq = existing.reduce(
    (max, v) => Math.max(max, Number(v.invoiceNumber.slice(prefix.length)) || 0),
    0
  );
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}
