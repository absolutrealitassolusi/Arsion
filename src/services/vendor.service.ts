import { api } from "@/lib/axios";
import type {
  VendorDetailResponse,
  VendorListResponse,
  VendorPayload,
} from "@/types/vendor";

export const vendorService = {
  async getAll(search?: string): Promise<VendorListResponse> {
    const { data } = await api.get<VendorListResponse>("/vendors", {
      params: { search },
    });
    return data;
  },

  async getById(id: string): Promise<VendorDetailResponse> {
    const { data } = await api.get<VendorDetailResponse>(`/vendors/${id}`);
    return data;
  },

  async create(payload: VendorPayload): Promise<VendorDetailResponse> {
    const { data } = await api.post<VendorDetailResponse>("/vendors", payload);
    return data;
  },

  async update(id: string, payload: VendorPayload): Promise<VendorDetailResponse> {
    const { data } = await api.put<VendorDetailResponse>(`/vendors/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/vendors/${id}`);
    return data;
  },
};
