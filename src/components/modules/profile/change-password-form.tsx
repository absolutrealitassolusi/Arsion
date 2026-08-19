"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { changePasswordSchema, type ChangePasswordValues } from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/axios";

/** Ganti password akun sendiri - terutama dipakai abis login pertama kali pakai password sementara hasil migrasi ke Supabase Auth. */
export function ChangePasswordForm() {
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (values: ChangePasswordValues) => {
    setIsSaving(true);
    try {
      await authService.updatePassword(values.password);
      toast.success("Password berhasil diganti.");
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengganti password."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ganti Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            id="password"
            label="Password Baru"
            type="password"
            error={errors.password?.message}
            {...register("password")}
          />
          <FormField
            id="confirmPassword"
            label="Konfirmasi Password Baru"
            type="password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSaving}>
              <KeyRound className="h-4 w-4" />
              Ganti Password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
