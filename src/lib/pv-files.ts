import type { PvFile } from "@/types/payment-voucher";

/**
 * Daftar file -> kolom lama `*Name` (nama digabung koma) & `*Urls` (semua
 * halaman diratakan). Kolom lama tetap diisi supaya cetak PV, ZIP lampiran,
 * dan data lama tetap jalan tanpa perlu diubah.
 */
export function flattenPvFiles(files: PvFile[]): { name: string | null; urls: string[] } {
  const nonEmpty = files.filter((f) => f.urls.length > 0);
  return {
    name: nonEmpty.length > 0 ? nonEmpty.map((f) => f.name).join(", ") : null,
    urls: nonEmpty.flatMap((f) => f.urls),
  };
}

/**
 * Baca daftar file dari baris DB - PV lama (sebelum kolom daftar file ada)
 * cuma punya kolom `*Name`/`*Urls`, dianggap 1 file.
 */
export function pvFilesFromRow(files: PvFile[] | null | undefined, legacyName: string | null, legacyUrls: string[]): PvFile[] {
  if (files && files.length > 0) return files;
  if (legacyUrls.length > 0) return [{ name: legacyName ?? "Lampiran", urls: legacyUrls }];
  return [];
}
