"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { loginSchema, type LoginValues } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/use-auth";
import type { ApiErrorShape } from "@/lib/axios";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    try {
      const user = await login(values);
      toast.success(`Selamat datang kembali, ${user.email}`);
      router.push("/dashboard");
    } catch (err) {
      const apiError = err as ApiErrorShape;
      toast.error(apiError.message ?? "Gagal masuk. Coba lagi.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary text-primary-foreground">
            <Boxes className="h-6 w-6" />
          </div>
          <CardTitle>Masuk ke Arsion</CardTitle>
          <CardDescription>Masukkan kredensial Anda untuk melanjutkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="you@company.com"
              autoFocus
              autoComplete="email"
              disabled={isLoggingIn}
              error={errors.email?.message}
              {...register("email")}
            />
            <FormField
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoggingIn}
              error={errors.password?.message}
              endAdornment={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register("password")}
            />
            <Link href="/forgot-password" className="block text-right text-xs text-primary hover:underline">
              Lupa password?
            </Link>
            <Button type="submit" className="w-full" isLoading={isLoggingIn}>
              <LogIn className="h-4 w-4" />
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
