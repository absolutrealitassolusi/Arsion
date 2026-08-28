import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectService } from "@/services/project.service";
import type { ApiErrorShape } from "@/lib/axios";
import type { ProjectPayload } from "@/types/project";

export const projectKeys = {
  all: ["projects"] as const,
  list: (search?: string) => [...projectKeys.all, "list", search ?? ""] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};

export function useProjects(search?: string) {
  return useQuery({
    queryKey: projectKeys.list(search),
    queryFn: () => projectService.getAll(search),
    staleTime: 30_000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectPayload) => projectService.create(payload),
    onSuccess: () => {
      toast.success("Project berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menambahkan project");
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProjectPayload) => projectService.update(id, payload),
    onSuccess: () => {
      toast.success("Project berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal memperbarui project");
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.remove(id),
    onSuccess: () => {
      toast.success("Project berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menghapus project");
    },
  });
}
