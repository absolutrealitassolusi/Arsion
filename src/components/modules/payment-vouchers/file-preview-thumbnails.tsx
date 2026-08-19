import { cn } from "@/lib/utils";

interface FilePreviewThumbnailsProps {
  urls: string[];
  altPrefix: string;
  className?: string;
}

/**
 * Grid thumbnail 32x32 buat preview tiap halaman dokumen (gambar, atau
 * halaman PDF yang sudah dirender jadi gambar via `fileToPreviewDataUrls`).
 * Dipakai berulang di form Create & tab Info/Payment/Tax - disatuin di sini
 * biar tidak ada 4 salinan JSX yang identik.
 */
export function FilePreviewThumbnails({ urls, altPrefix, className }: FilePreviewThumbnailsProps) {
  if (urls.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {urls.map((url, index) => (
        <div
          key={index}
          className="flex h-32 w-32 items-center justify-center rounded-[10px] border border-border bg-secondary/40 p-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`${altPrefix} halaman ${index + 1}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}
