"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/shared/form-field";
import { profileSchema, type ProfileFormValues } from "@/schemas/profile.schema";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authService } from "@/services/auth.service";
import type { ApiErrorShape } from "@/lib/axios";

/**
 * Role di sini cuma ditampilkan (read-only), bukan diedit sendiri oleh
 * user - ubah role lewat User Management. Submit ke `PATCH /auth/me`
 * (self-service - cuma boleh ubah nama/email diri sendiri, lihat
 * src/app/api/auth/me/route.ts). `router.refresh()` dipanggil abis sukses
 * biar CurrentUserProvider (di-resolve server-side di (dashboard)/layout.tsx)
 * ke-render ulang dengan data terbaru - context-nya sendiri gak bisa
 * di-refetch dari client.
 */
export function ProfileForm() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: currentUser.name,
      email: currentUser.email,
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSaving(true);
    try {
      await authService.updateProfile(values);
      toast.success(`Profil ${values.name} berhasil diperbarui`);
      router.refresh();
    } catch (err) {
      const apiError = err as ApiErrorShape;
      toast.error(apiError.message ?? "Gagal memperbarui profil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Akun</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Role</p>
            <div className="flex flex-wrap gap-1.5">
              {currentUser.roleNames.length === 0 && <Badge variant="outline">-</Badge>}
              {currentUser.roleNames.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          <FormField
            id="name"
            label="Nama Lengkap"
            error={errors.name?.message}
            {...register("name")}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving}>
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
