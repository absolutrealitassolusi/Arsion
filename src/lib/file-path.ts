/**
 * Fungsi murni, TANPA import apapun yang server-only (khususnya bukan
 * @supabase/supabase-js) - file ini aman diimpor dari kode client-side
 * (hook/komponen) maupun server (src/lib/file-storage.ts re-export dari
 * sini). Dipisah supaya hook client yang cuma butuh cek "ini path Storage
 * atau data URL lama?" gak ikut narik SDK Supabase ke bundle browser.
 */

export type UploadKind = "pv-attachment" | "pv-payment-proof" | "pv-tax-proof" | "signature";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg"];

/**
 * Bedain path Storage baru (mis. "pv-attachment/user123/abc.png") dari data
 * URL base64 lama (mis. "data:image/png;base64,...") - data lama TIDAK
 * pernah dimigrasi, dua bentuk ini hidup berdampingan selamanya di kolom
 * yang sama. `null`/string kosong juga dianggap "bukan path" (passthrough).
 */
export function isRemotePath(value: string | null | undefined): value is string {
  return Boolean(value) && !value!.startsWith("data:");
}

export function validateFile(file: { size: number; type: string }): { ok: true } | { ok: false; message: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { ok: false, message: `Tipe file "${file.type}" tidak didukung - cuma JPG/PNG.` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, message: `Ukuran file maksimal ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.` };
  }
  return { ok: true };
}
