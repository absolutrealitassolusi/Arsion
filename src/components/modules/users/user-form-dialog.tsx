"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { FormField } from "@/components/shared/form-field";
import { userSchema, createUserSchema, type CreateUserFormValues } from "@/schemas/user.schema";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import { departmentOptions } from "@/mocks/data/departments";
import { positionOptions } from "@/mocks/data/positions";
import type { User } from "@/types/user";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kosongkan untuk mode Tambah, isi untuk mode Edit. */
  user?: User | null;
}

const emptyValues: CreateUserFormValues = {
  name: "",
  email: "",
  department: "",
  position: "",
  roles: [],
  status: "active",
  password: "",
};

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEditMode = Boolean(user);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id ?? "");
  const { data: rolesData } = useRoles();
  const roleOptions = rolesData?.data.map((role) => role.name) ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(isEditMode ? userSchema : createUserSchema),
    defaultValues: emptyValues,
  });

  // Reset form setiap dialog dibuka - beda user (edit) atau mode tambah.
  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? {
            name: user.name,
            email: user.email,
            department: user.department,
            position: user.position,
            roles: user.roles,
            status: user.status,
            password: "",
          }
        : emptyValues
    );
  }, [open, user, reset]);

  const onSubmit = (values: CreateUserFormValues) => {
    if (isEditMode) {
      updateUser.mutate(values, { onSuccess: () => onOpenChange(false) });
    } else {
      createUser.mutate(values, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = isEditMode ? updateUser.isPending : createUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-base font-semibold">{isEditMode ? "Edit User" : "Tambah User"}</h2>
          <p className="text-sm text-muted-foreground">
            {isEditMode ? `Ubah data ${user?.name}.` : "Lengkapi data user baru."}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-4 px-6 py-5">
            <FormField
              id="name"
              label="Nama Lengkap"
              placeholder="Contoh: Dina Pratiwi"
              error={errors.name?.message}
              {...register("name")}
            />

            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="nama@arsion.app"
              error={errors.email?.message}
              {...register("email")}
            />

            {!isEditMode && (
              <FormField
                id="password"
                label="Password Awal"
                type="password"
                placeholder="Minimal 6 karakter"
                error={errors.password?.message}
                {...register("password")}
              />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  onValueChange={(value) => setValue("department", value, { shouldValidate: true })}
                  value={watch("department")}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Pilih department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  onValueChange={(value) => setValue("position", value, { shouldValidate: true })}
                  value={watch("position")}
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Pilih position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roles">Role (bisa lebih dari satu)</Label>
              <MultiSelect
                id="roles"
                options={roleOptions}
                value={watch("roles")}
                onChange={(value) => setValue("roles", value, { shouldValidate: true })}
                placeholder="Pilih role"
              />
              {errors.roles && <p className="text-xs text-destructive">{errors.roles.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) => setValue("status", value as CreateUserFormValues["status"], { shouldValidate: true })}
                value={watch("status")}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isPending}>
              <Save className="h-4 w-4" />
              {isEditMode ? "Simpan Perubahan" : "Simpan User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
