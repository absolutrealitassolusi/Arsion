import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vendorService } from "@/services/vendor.service";
import type { ApiErrorShape } from "@/lib/axios";
import type { VendorPayload } from "@/types/vendor";

export const vendorKeys = {
  all: ["vendors"] as const,
  list: (search?: string) => [...vendorKeys.all, "list", search ?? ""] as const,
  detail: (id: string) => [...vendorKeys.all, "detail", id] as const,
};

export function useVendors(search?: string) {
  return useQuery({
    queryKey: vendorKeys.list(search),
    queryFn: () => vendorService.getAll(search),
    staleTime: 30_000,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => vendorService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VendorPayload) => vendorService.create(payload),
    onSuccess: () => {
      toast.success("Vendor berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menambahkan vendor");
    },
  });
}

export function useUpdateVendor(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VendorPayload) => vendorService.update(id, payload),
    onSuccess: () => {
      toast.success("Vendor berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal memperbarui vendor");
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vendorService.remove(id),
    onSuccess: () => {
      toast.success("Vendor berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menghapus vendor");
    },
  });
}
