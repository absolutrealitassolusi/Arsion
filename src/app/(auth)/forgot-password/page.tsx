"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/axios";

export default function ForgotPasswordPage() {
  const { requestPasswordReset, isRequestingReset } = useAuth();
  const [isSent, setIsSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      const result = await requestPasswordReset(values);
      toast.success(result.message);
      setIsSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengirim link reset password - coba lagi."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>Lupa Password</CardTitle>
          <CardDescription>
            {isSent
              ? "Cek email Anda untuk link reset password."
              : "Masukkan email Anda dan kami akan mengirimkan link reset password."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSent && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" isLoading={isRequestingReset}>
                Kirim Link Reset
              </Button>
            </form>
          )}

          <Link
            href="/login"
            className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Masuk
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
