export type ProjectStatus = "ongoing" | "completed" | "on_hold" | "cancelled";

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  clientName?: string;
  picName?: string;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  updatedAt: string;
}

export type ProjectPayload = Omit<Project, "id" | "updatedAt">;

export interface ProjectListResponse {
  data: Project[];
  total: number;
}

export interface ProjectDetailResponse {
  data: Project;
}
