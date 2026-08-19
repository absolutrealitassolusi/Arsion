import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companyService } from "@/services/company.service";
import type { ApiErrorShape } from "@/lib/axios";
import type { CompanyPayload } from "@/types/company";

export const companyKeys = {
  all: ["company"] as const,
};

export function useCompany() {
  return useQuery({
    queryKey: companyKeys.all,
    queryFn: () => companyService.get(),
    staleTime: 30_000,
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompanyPayload) => companyService.update(payload),
    onSuccess: () => {
      toast.success("Data perusahaan berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menyimpan data perusahaan");
    },
  });
}
