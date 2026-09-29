import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customerService } from "@/services/customer.service";
import type { ApiErrorShape } from "@/lib/axios";
import type { CustomerFilters, CustomerPayload } from "@/types/customer";

export const customerKeys = {
  all: ["customers"] as const,
  list: (filters: CustomerFilters) => [...customerKeys.all, "list", filters] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
};

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customerService.getAll(filters),
    staleTime: 30_000,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CustomerPayload) => customerService.create(payload),
    onSuccess: () => {
      toast.success("Customer berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menambahkan customer");
    },
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CustomerPayload) => customerService.update(id, payload),
    onSuccess: () => {
      toast.success("Customer berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal memperbarui customer");
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.remove(id),
    onSuccess: () => {
      toast.success("Customer berhasil dinonaktifkan");
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menonaktifkan customer");
    },
  });
}

export function useReactivateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.reactivate(id),
    onSuccess: () => {
      toast.success("Customer berhasil diaktifkan");
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal mengaktifkan customer");
    },
  });
}
