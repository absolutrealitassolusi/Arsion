import { api } from "@/lib/axios";
import type {
  CustomerDetailResponse,
  CustomerFilters,
  CustomerListResponse,
  CustomerPayload,
} from "@/types/customer";

export const customerService = {
  async getAll(filters: CustomerFilters = {}): Promise<CustomerListResponse> {
    const { data } = await api.get<CustomerListResponse>("/customers", {
      params: filters,
    });
    return data;
  },

  async getById(id: string): Promise<CustomerDetailResponse> {
    const { data } = await api.get<CustomerDetailResponse>(`/customers/${id}`);
    return data;
  },

  async create(payload: CustomerPayload): Promise<CustomerDetailResponse> {
    const { data } = await api.post<CustomerDetailResponse>("/customers", payload);
    return data;
  },

  async update(id: string, payload: CustomerPayload): Promise<CustomerDetailResponse> {
    const { data } = await api.put<CustomerDetailResponse>(`/customers/${id}`, payload);
    return data;
  },

  /** Nonaktifkan customer (soft-delete - lihat DELETE /api/customers/[id]). */
  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/customers/${id}`);
    return data;
  },

  async reactivate(id: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/customers/${id}`);
    return data;
  },
};
