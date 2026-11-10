/**
 * Kode master data berikutnya (Vendor/Customer/Project) - port dari
 * `_next_kode` di SiPV: cari kode dengan angka di belakang yang PALING BESAR
 * (mis. VND-007), naikkan +1 dengan prefix & panjang digit yang sama
 * (VND-008). Kalau belum ada kode sama sekali -> `${defaultPrefix}001`.
 * Fungsi murni - aman dipakai di test tanpa DB.
 */
export function nextMasterCode(existingCodes: string[], defaultPrefix: string): string {
  let best: { n: number; prefix: string; width: number } | null = null;
  for (const raw of existingCodes) {
    const match = /^(.*?)(\d+)$/.exec(raw.trim());
    if (!match) continue;
    const n = Number(match[2]);
    if (!best || n > best.n) best = { n, prefix: match[1]!, width: match[2]!.length };
  }
  if (!best) return `${defaultPrefix}001`;

  const taken = new Set(existingCodes);
  let n = best.n;
  let code: string;
  do {
    n += 1;
    code = `${best.prefix}${String(n).padStart(best.width, "0")}`;
  } while (taken.has(code));
  return code;
}
