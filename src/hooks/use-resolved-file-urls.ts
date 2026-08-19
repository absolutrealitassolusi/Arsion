import { useQuery } from "@tanstack/react-query";
import { fileResolveService } from "@/services/file-resolve.service";
import { isRemotePath } from "@/lib/file-path";

/**
 * Resolve array value mentah (campuran data URL base64 lama, path Storage
 * baru, dan null) jadi array yang siap langsung dipakai sebagai `<img src>`
 * (data URL lama tetap apa adanya, path Storage baru jadi signed URL).
 * Short-circuit total di client - kalau gak ada satupun yang butuh
 * di-resolve (semua data URL lama/null), gak nembak network sama sekali.
 */
export function useResolvedFileUrls(values: (string | null | undefined)[] | undefined) {
  const needsResolve = (values ?? []).some((v) => isRemotePath(v ?? null));
  const normalized = values ?? [];

  const query = useQuery({
    queryKey: ["resolved-file-urls", normalized],
    queryFn: () => fileResolveService.resolveUrls(normalized.map((v) => v ?? null)),
    enabled: needsResolve,
    staleTime: 60_000,
  });

  if (!needsResolve) {
    return { data: normalized.map((v) => v ?? null), isLoading: false };
  }
  return { data: query.data, isLoading: query.isLoading };
}

/** Versi 1 value (mis. tanda tangan) - dibungkus dari `useResolvedFileUrls`, gak duplikasi logic. */
export function useResolvedFileUrl(value: string | null | undefined) {
  const { data, isLoading } = useResolvedFileUrls([value]);
  return { data: data?.[0] ?? null, isLoading };
}
