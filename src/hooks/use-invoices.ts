import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoiceService, type InvoiceFilters } from "@/services/invoice.service";
import type { ApiErrorShape } from "@/lib/axios";
import type { InvoicePayload } from "@/types/invoice";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (filters: InvoiceFilters) => [...invoiceKeys.all, "list", filters] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};

export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => invoiceService.getAll(filters),
    staleTime: 30_000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoiceService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InvoicePayload) => invoiceService.create(payload),
    onSuccess: () => {
      toast.success("Invoice berhasil dibuat sebagai Draft");
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal membuat Invoice");
    },
  });
}

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InvoicePayload) => invoiceService.update(id, payload),
    onSuccess: () => {
      toast.success("Perubahan Invoice berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menyimpan perubahan Invoice");
    },
  });
}

export function useSendInvoice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => invoiceService.send(id),
    onSuccess: () => {
      toast.success("Invoice ditandai terkirim");
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menandai Invoice terkirim");
    },
  });
}

export function useMarkInvoicePaid(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => invoiceService.markPaid(id),
    onSuccess: () => {
      toast.success("Invoice ditandai lunas");
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menandai Invoice lunas");
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceService.remove(id),
    onSuccess: () => {
      toast.success("Invoice berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menghapus Invoice");
    },
  });
}
