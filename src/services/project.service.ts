import { api } from "@/lib/axios";
import type {
  ProjectDetailResponse,
  ProjectFilters,
  ProjectListResponse,
  ProjectPayload,
} from "@/types/project";

export const projectService = {
  async getAll(filters: ProjectFilters = {}): Promise<ProjectListResponse> {
    const { data } = await api.get<ProjectListResponse>("/projects", {
      params: filters,
    });
    return data;
  },

  async getById(id: string): Promise<ProjectDetailResponse> {
    const { data } = await api.get<ProjectDetailResponse>(`/projects/${id}`);
    return data;
  },

  async create(payload: ProjectPayload): Promise<ProjectDetailResponse> {
    const { data } = await api.post<ProjectDetailResponse>("/projects", payload);
    return data;
  },

  async update(id: string, payload: ProjectPayload): Promise<ProjectDetailResponse> {
    const { data } = await api.put<ProjectDetailResponse>(`/projects/${id}`, payload);
    return data;
  },

  /** Arsipkan project (soft-delete - lihat DELETE /api/projects/[id]). */
  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/projects/${id}`);
    return data;
  },

  async reactivate(id: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/projects/${id}`);
    return data;
  },
};
