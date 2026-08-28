import { api } from "@/lib/axios";
import type {
  ProjectDetailResponse,
  ProjectListResponse,
  ProjectPayload,
} from "@/types/project";

export const projectService = {
  async getAll(search?: string): Promise<ProjectListResponse> {
    const { data } = await api.get<ProjectListResponse>("/projects", {
      params: { search },
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

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/projects/${id}`);
    return data;
  },
};
