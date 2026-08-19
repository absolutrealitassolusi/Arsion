import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userService, type UserListFilters } from "@/services/user.service";
import type { ApiErrorShape } from "@/lib/axios";
import type { CreateUserPayload, UserPayload, UserStatus } from "@/types/user";

export const userKeys = {
  all: ["users"] as const,
  list: (filters: UserListFilters) => [...userKeys.all, "list", filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};

export function useUsers(filters: UserListFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userService.getAll(filters),
    staleTime: 30_000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create(payload),
    onSuccess: () => {
      toast.success("User berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menambahkan user");
    },
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserPayload) => userService.update(id, payload),
    onSuccess: () => {
      toast.success("User berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal memperbarui user");
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) =>
      userService.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(status === "active" ? "User berhasil diaktifkan" : "User berhasil dinonaktifkan");
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal mengubah status user");
    },
  });
}

export function useUpdateUserSignature(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { signatureUrl: string | null; signatureFileName: string | null }) =>
      userService.updateSignature(id, payload),
    onSuccess: (_, payload) => {
      toast.success(payload.signatureUrl ? "Tanda tangan berhasil disimpan" : "Tanda tangan berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menyimpan tanda tangan");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => {
      toast.success("User berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error: ApiErrorShape) => {
      toast.error(error.message ?? "Gagal menghapus user");
    },
  });
}
