import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentVoucherService, type PaymentVoucherFilters } from "@/services/payment-voucher.service";
import type { ApiErrorShape } from "@/lib/axios";
import type { PaymentVoucherPayload } from "@/types/payment-voucher";

export const paymentVoucherKeys = {
  all: ["payment-vouchers"] as const,
  list: (filters: PaymentVoucherFilters) => [...paymentVoucherKeys.all, "list", filters] as const,
  detail: (id: string) => [...paymentVoucherKeys.all, "detail", id] as const,
};

export function usePaymentVouchers(filters: PaymentVoucherFilters = {}) {
  return useQuery({
    queryKey: paymentVoucherKeys.list(filters),
    queryFn: () => paymentVoucherService.getAll(filters),
    staleTime: 30_000,
  });
}

export function usePaymentVoucher(id: string) {
  return useQuery({
    queryKey: paymentVoucherKeys.detail(id),
    queryFn: () => paymentVoucherService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentVoucherPayload) => paymentVoucherService.create(payload),
    onSuccess: () => {
      toast.success("Payment Voucher berhasil dibuat sebagai Draft");
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal membuat Payment Voucher");
    },
  });
}

export function useUpdatePaymentVoucher(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PaymentVoucherPayload) => paymentVoucherService.update(id, payload),
    onSuccess: () => {
      toast.success("Perubahan Payment Voucher berhasil disimpan sebagai Draft");
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menyimpan perubahan Payment Voucher");
    },
  });
}

export function useSubmitPaymentVoucher(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => paymentVoucherService.submit(id),
    onSuccess: () => {
      toast.success("Payment Voucher diajukan untuk approval");
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal mengajukan Payment Voucher");
    },
  });
}

export function useApprovePaymentVoucher(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => paymentVoucherService.approve(id),
    onSuccess: () => {
      toast.success("Payment Voucher disetujui");
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menyetujui Payment Voucher");
    },
  });
}

export function useRejectPaymentVoucher(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note?: string) => paymentVoucherService.reject(id, note),
    onSuccess: () => {
      toast.success("Payment Voucher ditolak");
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menolak Payment Voucher");
    },
  });
}

export function useMarkPaymentVoucherPaid(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => paymentVoucherService.markPaid(id),
    onSuccess: () => {
      toast.success("Payment Voucher ditandai sudah dibayar");
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menandai pembayaran");
    },
  });
}

export function useUpdateTaxInvoice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taxInvoiceNumber,
      taxProofFileName,
      taxProofUrls,
    }: {
      taxInvoiceNumber: string;
      taxProofFileName?: string | null;
      taxProofUrls?: string[] | null;
    }) => paymentVoucherService.updateTaxInvoice(id, taxInvoiceNumber, taxProofFileName, taxProofUrls),
    onSuccess: () => {
      toast.success("Nomor Faktur Pajak berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menyimpan Faktur Pajak");
    },
  });
}

export function useUploadPaymentProof(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentProofFileName,
      paymentProofUrls,
    }: {
      paymentProofFileName: string;
      paymentProofUrls: string[];
    }) => paymentVoucherService.uploadPaymentProof(id, paymentProofFileName, paymentProofUrls),
    onSuccess: () => {
      toast.success("Bukti pembayaran berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menyimpan bukti pembayaran");
    },
  });
}

export function useDeletePaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentVoucherService.remove(id),
    onSuccess: () => {
      toast.success("Payment Voucher berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menghapus Payment Voucher");
    },
  });
}
