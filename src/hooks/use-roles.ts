import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { roleService } from "@/services/role.service";
import type { ApiErrorShape } from "@/lib/axios";
import type { RolePayload } from "@/types/role";

export const roleKeys = {
  all: ["roles"] as const,
  list: (search?: string) => [...roleKeys.all, "list", search ?? ""] as const,
  detail: (id: string) => [...roleKeys.all, "detail", id] as const,
};

export function useRoles(search?: string) {
  return useQuery({
    queryKey: roleKeys.list(search),
    queryFn: () => roleService.getAll(search),
    staleTime: 30_000,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => roleService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RolePayload) => roleService.create(payload),
    onSuccess: () => {
      toast.success("Role berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menambahkan role");
    },
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RolePayload) => roleService.update(id, payload),
    onSuccess: () => {
      toast.success("Role berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal memperbarui role");
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roleService.remove(id),
    onSuccess: () => {
      toast.success("Role berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menghapus role");
    },
  });
}
