"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { roleSchema, type RoleFormValues } from "@/schemas/role.schema";
import { useCreateRole } from "@/hooks/use-roles";

export function RoleForm() {
  const router = useRouter();
  const createRole = useCreateRole();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (values: RoleFormValues) => {
    createRole.mutate(
      { ...values, permissions: [] },
      { onSuccess: () => router.push("/manajemen-user/daftar-role") }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Role</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            id="name"
            label="Nama Role"
            placeholder="Contoh: Staff Operasional"
            error={errors.name?.message}
            {...register("name")}
          />

          <FormField
            id="description"
            label="Deskripsi"
            placeholder="Jelaskan cakupan akses role ini"
            error={errors.description?.message}
            {...register("description")}
          />

          <p className="text-xs text-muted-foreground">
            Role baru dibuat tanpa permission. Assign permission bisa dilakukan setelah role tersimpan, lewat menu Edit.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/manajemen-user/daftar-role")}>
              Batal
            </Button>
            <Button type="submit" isLoading={createRole.isPending}>
              <Save className="h-4 w-4" />
              Simpan Role
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
