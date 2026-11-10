import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

const ENDPOINT = {
  vendor: "/vendors/next-code",
  customer: "/customers/next-code",
  project: "/projects/next-code",
} as const;

/** Usulan kode berikutnya buat form Tambah Vendor/Customer/Project (lihat GET .../next-code). */
export function useNextMasterCode(kind: keyof typeof ENDPOINT, enabled: boolean) {
  return useQuery({
    queryKey: ["next-master-code", kind] as const,
    queryFn: async () => {
      const { data } = await api.get<{ data: { code: string } }>(ENDPOINT[kind]);
      return data.data.code;
    },
    enabled,
    staleTime: 0,
    retry: false,
  });
}
