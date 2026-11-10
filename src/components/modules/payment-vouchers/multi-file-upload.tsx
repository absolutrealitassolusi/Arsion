"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePreviewThumbnails } from "@/components/modules/payment-vouchers/file-preview-thumbnails";
import { useUploadDataUrls } from "@/hooks/use-file-upload";
import { useResolvedFileUrls } from "@/hooks/use-resolved-file-urls";
import { fileToPreviewDataUrls } from "@/lib/file-to-data-url";
import { getErrorMessage } from "@/lib/axios";
import type { UploadKind } from "@/lib/file-path";
import type { PvFile } from "@/types/payment-voucher";

interface MultiFileUploadProps {
  id: string;
  files: PvFile[];
  onChange: (files: PvFile[]) => void;
  kind: UploadKind;
  placeholder: string;
  disabled?: boolean;
  altPrefix: string;
  /** Dipanggil tiap kali status upload berubah - biar tombol simpan bisa dikunci selama upload jalan. */
  onUploadingChange?: (uploading: boolean) => void;
}

/**
 * Upload banyak file sekaligus (JPG/PNG/PDF; PDF dipecah per halaman) ke
 * Storage, dengan daftar nama file yang bisa dihapus satu-satu + preview
 * semua halaman. Dipakai buat Lampiran PV & Bukti Pembayaran.
 */
export function MultiFileUpload({
  id,
  files,
  onChange,
  kind,
  placeholder,
  disabled,
  altPrefix,
  onUploadingChange,
}: MultiFileUploadProps) {
  const upload = useUploadDataUrls();
  // Preview lokal (data URL) buat file yang baru di-upload di sesi ini -
  // langsung tampil tanpa nunggu signed URL dari Storage.
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});

  const allPaths = useMemo(() => files.flatMap((f) => f.urls), [files]);
  const remotePaths = allPaths.filter((p) => !localPreviews[p]);
  const resolved = useResolvedFileUrls(remotePaths.length > 0 ? remotePaths : undefined);
  const previewUrls = allPaths
    .map((p) => localPreviews[p] ?? resolved.data?.[remotePaths.indexOf(p)] ?? null)
    .filter((u): u is string => Boolean(u));

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const selected = Array.from(input.files ?? []);
    if (selected.length === 0) return;
    onUploadingChange?.(true);
    const added: PvFile[] = [];
    const previews: Record<string, string> = {};
    try {
      for (const file of selected) {
        try {
          const dataUrls = await fileToPreviewDataUrls(file);
          const paths = await upload.mutateAsync({ dataUrls, kind, baseName: file.name });
          paths.forEach((p, i) => (previews[p] = dataUrls[i]!));
          added.push({ name: file.name, urls: paths });
        } catch (err) {
          toast.error(getErrorMessage(err, `Gagal meng-upload "${file.name}" - coba file lain.`));
        }
      }
      if (added.length > 0) {
        setLocalPreviews((prev) => ({ ...prev, ...previews }));
        onChange([...files, ...added]);
      }
    } finally {
      onUploadingChange?.(false);
      // Reset supaya file yang sama persis bisa dipilih lagi.
      input.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
        aria-disabled={disabled || upload.isPending}
      >
        <Paperclip className="h-4 w-4" />
        {upload.isPending ? "Meng-upload..." : placeholder}
      </label>
      <input
        id={id}
        type="file"
        multiple
        accept="image/png,image/jpeg,application/pdf"
        className="hidden"
        disabled={disabled || upload.isPending}
        onChange={handleChange}
      />

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-[8px] border border-border px-3 py-1.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
                {file.urls.length > 1 && (
                  <span className="shrink-0 text-xs text-muted-foreground">({file.urls.length} halaman)</span>
                )}
              </span>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={`Hapus ${file.name}`}
                  onClick={() => onChange(files.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <FilePreviewThumbnails urls={previewUrls} altPrefix={altPrefix} />
    </div>
  );
}
