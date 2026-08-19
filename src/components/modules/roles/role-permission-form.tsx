"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/shared/form-field";
import { roleSchema, type RoleFormValues } from "@/schemas/role.schema";
import { useRole, useUpdateRole } from "@/hooks/use-roles";
import { PERMISSION_GROUPS, type Permission } from "@/config/permissions";
import { cn } from "@/lib/utils";

interface RolePermissionFormProps {
  roleId: string;
  /** true = tampilkan semua sebagai read-only (halaman "Lihat"), tanpa tombol simpan. */
  readOnly?: boolean;
}

const totalPermissions = PERMISSION_GROUPS.flatMap((group) => group.permissions).length;

export function RolePermissionForm({ roleId, readOnly = false }: RolePermissionFormProps) {
  const router = useRouter();
  const { data, isLoading } = useRole(roleId);
  const updateRole = useUpdateRole(roleId);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({ resolver: zodResolver(roleSchema) });

  // defaultValues react-hook-form tidak bisa dipakai di sini karena data
  // role-nya baru datang async (fetch) - jadi form di-"reset" begitu data tiba.
  useEffect(() => {
    if (data?.data) {
      reset({ name: data.data.name, description: data.data.description });
      setSelectedPermissions(data.data.permissions);
    }
  }, [data, reset]);

  const togglePermission = (key: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const onSubmit = (values: RoleFormValues) => {
    updateRole.mutate(
      { ...values, permissions: selectedPermissions },
      { onSuccess: () => router.push("/manajemen-user/daftar-role") }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Memuat data role...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Role</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            id="name"
            label="Nama Role"
            disabled={readOnly}
            error={errors.name?.message}
            {...register("name")}
          />

          <FormField
            id="description"
            label="Deskripsi"
            disabled={readOnly}
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="space-y-3">
            <p className="text-sm font-medium">Permission</p>
            <div className="space-y-5 rounded-[10px] border border-border p-4">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.permissions.map((perm) => (
                      <label
                        key={perm.key}
                        className={cn(
                          "flex items-center gap-2 text-sm",
                          readOnly && "text-muted-foreground"
                        )}
                      >
                        <Checkbox
                          checked={selectedPermissions.includes(perm.key)}
                          onChange={() => togglePermission(perm.key)}
                          disabled={readOnly}
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPermissions.length} dari {totalPermissions} permission dipilih.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            {readOnly ? (
              <Button
                type="button"
                onClick={() => router.push(`/manajemen-user/daftar-role/${roleId}/edit`)}
              >
                <Pencil className="h-4 w-4" />
                Edit Role
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => router.push("/manajemen-user/daftar-role")}>
                  Batal
                </Button>
                <Button type="submit" isLoading={updateRole.isPending}>
                  <Save className="h-4 w-4" />
                  Simpan Perubahan
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
