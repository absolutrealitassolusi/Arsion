import { api } from "@/lib/axios";
import type {
  RoleDetailResponse,
  RoleListResponse,
  RolePayload,
} from "@/types/role";

export const roleService = {
  async getAll(search?: string): Promise<RoleListResponse> {
    const { data } = await api.get<RoleListResponse>("/roles", {
      params: { search },
    });
    return data;
  },

  async getById(id: string): Promise<RoleDetailResponse> {
    const { data } = await api.get<RoleDetailResponse>(`/roles/${id}`);
    return data;
  },

  async create(payload: RolePayload): Promise<RoleDetailResponse> {
    const { data } = await api.post<RoleDetailResponse>("/roles", payload);
    return data;
  },

  async update(id: string, payload: RolePayload): Promise<RoleDetailResponse> {
    const { data } = await api.put<RoleDetailResponse>(`/roles/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/roles/${id}`);
    return data;
  },
};
