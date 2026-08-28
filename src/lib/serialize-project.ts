import type { Project as ApiProject, ProjectStatus } from "@/types/project";

interface PrismaProject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  clientName: string | null;
  picName: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: ProjectStatus;
  updatedAt: Date;
}

export function serializeProject(project: PrismaProject): ApiProject {
  return {
    id: project.id,
    name: project.name,
    code: project.code,
    description: project.description ?? undefined,
    clientName: project.clientName ?? undefined,
    picName: project.picName ?? undefined,
    startDate: project.startDate?.toISOString(),
    endDate: project.endDate?.toISOString(),
    status: project.status,
    updatedAt: project.updatedAt.toISOString(),
  };
}
