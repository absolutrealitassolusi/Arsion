import { api } from "@/lib/axios";
import type {
  CustomerDetailResponse,
  CustomerListResponse,
  CustomerPayload,
} from "@/types/customer";

export const customerService = {
  async getAll(search?: string): Promise<CustomerListResponse> {
    const { data } = await api.get<CustomerListResponse>("/customers", {
      params: { search },
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

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/customers/${id}`);
    return data;
  },
};
