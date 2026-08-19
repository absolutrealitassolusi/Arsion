import { useMutation } from "@tanstack/react-query";
import { uploadService } from "@/services/upload.service";
import { validateFile, type UploadKind } from "@/lib/file-path";

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const type = header?.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

/**
 * Upload 1 atau lebih data URL (hasil `fileToPreviewDataUrls()` - 1 elemen
 * kalau JPG/PNG, banyak kalau PDF multi-halaman) ke Supabase Storage,
 * balikin path-nya (urutan sama) buat disimpan sebagai value
 * form/submission - BUKAN data URL-nya lagi. Validasi ukuran/tipe dicek di
 * sini juga (client-side, buat feedback instan) sebelum request keluar -
 * validasi yang sebenarnya menentukan tetap di server (`validateFile()` di
 * Route Handler-nya).
 */
export function useUploadDataUrls() {
  return useMutation({
    mutationFn: async ({ dataUrls, kind, baseName }: { dataUrls: string[]; kind: UploadKind; baseName: string }) => {
      const paths: string[] = [];
      for (let i = 0; i < dataUrls.length; i++) {
        const blob = dataUrlToBlob(dataUrls[i]!);
        const validation = validateFile(blob);
        if (!validation.ok) {
          throw new Error(validation.message);
        }
        const fileName = dataUrls.length > 1 ? `${baseName}-halaman-${i + 1}` : baseName;
        const { path } = await uploadService.uploadFile(blob, fileName, kind);
        paths.push(path);
      }
      return paths;
    },
  });
}
