"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changePasswordSchema, type ChangePasswordValues } from "@/schemas/auth.schema";
import { authService } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/axios";
import { useState } from "react";

/**
 * Dibuka dari link di email reset password (Supabase auto-detect token dari
 * URL & bikin recovery session begitu halaman ini kebuka - lihat
 * src/middleware.ts, path ini sengaja tetap public).
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (values: ChangePasswordValues) => {
    setIsSaving(true);
    try {
      await authService.updatePassword(values.password);
      toast.success("Password berhasil diganti - silakan login pakai password baru.");
      router.push("/login");
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengganti password."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>Set Password Baru</CardTitle>
          <CardDescription>Masukkan password baru untuk akun Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" isLoading={isSaving}>
              Simpan Password Baru
            </Button>
          </form>

          <Link href="/login" className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground">
            Kembali ke Masuk
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
