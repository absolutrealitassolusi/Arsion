/**
 * Render SEMUA halaman sebuah PDF jadi gambar PNG (data URL) - dipakai
 * biar dokumen PDF multi-halaman (Lampiran/Bukti Pembayaran/Bukti Pajak)
 * tetap bisa ditampilkan & ikut ke-print lengkap semua halamannya, sama
 * kayak JPG/PNG.
 */
export async function pdfToImages(dataUrl: string): Promise<string[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ url: dataUrl }).promise;
  const images: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Gagal membuat canvas untuk render PDF.");

    await page.render({ canvasContext: context, viewport, canvas }).promise;
    images.push(canvas.toDataURL("image/png"));
  }

  return images;
}
