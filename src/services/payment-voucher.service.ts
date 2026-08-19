import { api } from "@/lib/axios";
import type {
  PaymentVoucherDetailResponse,
  PaymentVoucherListResponse,
  PaymentVoucherPayload,
  PvDirection,
  PvStatus,
} from "@/types/payment-voucher";

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

  async reject(id: string, note?: string): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/reject`, { note });
    return data;
  },

  async markPaid(id: string): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/pay`);
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
  async uploadPaymentProof(
    id: string,
    paymentProofFileName: string,
    paymentProofUrls: string[]
  ): Promise<PaymentVoucherDetailResponse> {
    const { data } = await api.patch<PaymentVoucherDetailResponse>(`/payment-vouchers/${id}/payment-proof`, {
      paymentProofFileName,
      paymentProofUrls,
    });
    return data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/payment-vouchers/${id}`);
    return data;
  },
};
