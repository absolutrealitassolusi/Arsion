import { api } from "@/lib/axios";
import type { InvoiceDetailResponse, InvoiceListResponse, InvoicePayload, InvoiceStatus } from "@/types/invoice";

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus;
}

export const invoiceService = {
  async getAll(filters: InvoiceFilters = {}): Promise<InvoiceListResponse> {
    const { data } = await api.get<InvoiceListResponse>("/invoices", { params: filters });
    return data;
  },

  async getById(id: string): Promise<InvoiceDetailResponse> {
    const { data } = await api.get<InvoiceDetailResponse>(`/invoices/${id}`);
    return data;
  },

  async create(payload: InvoicePayload): Promise<InvoiceDetailResponse> {
    const { data } = await api.post<InvoiceDetailResponse>("/invoices", payload);
    return data;
  },

  /** Cuma boleh dipanggil kalau status Invoice Draft - lihat route PUT. */
  async update(id: string, payload: InvoicePayload): Promise<InvoiceDetailResponse> {
    const { data } = await api.put<InvoiceDetailResponse>(`/invoices/${id}`, payload);
    return data;
  },

  async send(id: string): Promise<InvoiceDetailResponse> {
    const { data } = await api.patch<InvoiceDetailResponse>(`/invoices/${id}/send`);
    return data;
  },

  async markPaid(id: string): Promise<InvoiceDetailResponse> {
    const { data } = await api.patch<InvoiceDetailResponse>(`/invoices/${id}/pay`);
    return data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/invoices/${id}`);
    return data;
  },
};
