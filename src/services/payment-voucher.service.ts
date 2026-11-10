import { api } from "@/lib/axios";
import type {
  PaymentVoucherDetailResponse,
  PaymentVoucherListResponse,
  PaymentVoucherPayload,
  PvDirection,
  PvFile,
  PvStatus,
  PvStatusCounts,
} from "@/types/payment-voucher";

export interface PaymentProofPayload {
  paymentProofs: PvFile[];
  paymentNote?: string;
}

export interface PaymentVoucherFilters {
  direction?: PvDirection;
  search?: string;
  status?: PvStatus;
}

export const paymentVoucherService = {
  async getAll(filters: PaymentVoucherFilters = {}): Promise<PaymentVoucherListResponse> {
    const { data } = await api.get<PaymentVoucherListResponse>("/payment-vouchers", {
      params: filters,
    });
    return data;
  },

  async getStatusCounts(): Promise<PvStatusCounts> {
    const { data } = await api.get<{ data: PvStatusCounts }>("/payment-vouchers/status-counts");
    return data.data;
  },

  /** Perkiraan nomor PV berikutnya buat tanggal ini - gak menaikkan counter. */
  async previewNextNumber(date: string): Promise<{ data: { voucherNumber: string; isPreview: true } }> {
    const { data } = await api.get<{ data: { voucherNumber: string; isPreview: true } }>(
      "/payment-vouchers/next-number",
      { params: { date } }
    );
    return data;
  },

  async getById(id: string): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.get<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}`);
    return data;
  },

  async create(payload: PaymentVoucherPayload): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.post<PaymentVoucherDetailResponse>("/payment-vouchers", payload);
    return data;
  },

  /** Cuma boleh dipanggil kalau status PV Draft/Ditolak - lihat route PUT. */
  async update(id: string, payload: PaymentVoucherPayload): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.put<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}`, payload);
    return data;
  },

  async submit(id: string): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/submit`);
    return data;
  },

  async approve(id: string): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/approve`);
    return data;
  },

  async reject(id: string, note: string): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/reject`, { note });
    return data;
  },

  /** Batalkan PV (semua status kecuali Dibayar) - alasan wajib, lihat route PATCH /cancel. */
  async cancel(id: string, note: string): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/cancel`, { note });
    return data;
  },

  /** Bukti pembayaran wajib - Tanggal Dibayar dicatat server saat ini juga. */
  async markPaid(id: string, payload: PaymentProofPayload): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/pay`, payload);
    return data;
  },

  /** Cuma boleh dipanggil kalau status PV sudah "paid" - lihat mock-adapter. */
  async updateTaxInvoice(
    id: string,
    taxInvoiceNumber: string,
    taxProofFileName?: string | null,
    taxProofUrls?: string[] | null
  ): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/tax-invoice`, {
      taxInvoiceNumber,
      taxProofFileName,
      taxProofUrls,
    });
    return data;
  },

  /** Cuma boleh dipanggil kalau status PV sudah "paid" - lihat mock-adapter. */
  async uploadPaymentProof(id: string, payload: PaymentProofPayload): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/payment-proof`, payload);
    return data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/payment-vouchers/${id}`);
    return data;
  },
};
