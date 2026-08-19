import { pdfToImages } from "@/lib/pdf-to-image";

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Data URL gambar bisa langsung dirender lewat <img>; PDF/dokumen lain gak bisa. */
export function isImageDataUrl(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith("data:image/"));
}

/**
 * Selalu balikin array data URL yang bisa langsung dirender sebagai gambar -
 * kalau file-nya JPG/PNG, balikin 1 elemen (gambarnya sendiri); kalau PDF,
 * SEMUA halamannya di-render jadi gambar. Dipakai di semua upload bukti
 * dokumen (Lampiran/Bukti Pembayaran/Bukti Pajak) biar preview & hasil
 * print selalu bisa nampilin isi lengkapnya, bukan cuma nama file.
 */
export async function fileToPreviewDataUrls(file: File): Promise<string[]> {
  const dataUrl = await fileToDataUrl(file);
  if (file.type === "application/pdf") {
    return pdfToImages(dataUrl);
  }
  return [dataUrl];
}
