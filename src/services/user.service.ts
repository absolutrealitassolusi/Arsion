import { api } from "@/lib/axios";
import type {
  CreateUserPayload,
  UserDetailResponse,
  UserListResponse,
  UserPayload,
  UserStatus,
} from "@/types/user";

export interface UserListFilters {
  search?: string;
  department?: string;
  role?: string;
  status?: UserStatus;
}

export const userService = {
  async getAll(filters: UserListFilters = {}): Promise<UserListResponse> {
    const { data } = await api.get<UserListResponse>("/users", {
      params: filters,
    });
    return data;
  },

  async getById(id: string): Promise<UserDetailResponse> {
    const { data } = await api.get<UserDetailResponse>(`/users/${id}`);
    return data;
  },

  async create(payload: CreateUserPayload): Promise<UserDetailResponse> {
    const { data } = await api.post<UserDetailResponse>("/users", payload);
    return data;
  },

  async update(id: string, payload: UserPayload): Promise<UserDetailResponse> {
    const { data } = await api.put<UserDetailResponse>(`/users/${id}`, payload);
    return data;
  },

  async updateStatus(id: string, status: UserStatus): Promise<UserDetailResponse> {
    const { data } = await api.patch<UserDetailResponse>(`/users/${id}/status`, { status });
    return data;
  },

  /** Upload/replace tanda tangan kirim `signatureUrl` berisi; hapus kirim `signatureUrl: null`. */
  async updateSignature(
    id: string,
    payload: { signatureUrl: string | null; signatureFileName: string | null }
  ): Promise<UserDetailResponse> {
    const { data } = await api.patch<UserDetailResponse>(`/users/${id}/signature`, payload);
    return data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/users/${id}`);
    return data;
  },
};
