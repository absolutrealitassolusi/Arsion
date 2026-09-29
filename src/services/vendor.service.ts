import { api } from "@/lib/axios";
import type {
  VendorDetailResponse,
  VendorFilters,
  VendorListResponse,
  VendorPayload,
} from "@/types/vendor";

export const vendorService = {
  async getAll(filters: VendorFilters = {}): Promise<VendorListResponse> {
    const { data } = await api.get<VendorListResponse>("/vendors", {
      params: filters,
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

  /** Nonaktifkan vendor (soft-delete - lihat DELETE /api/vendors/[id]). */
  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/vendors/${id}`);
    return data;
  },

  async reactivate(id: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/vendors/${id}`);
    return data;
  },
};
