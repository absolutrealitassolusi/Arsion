"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { customerSchema, type CustomerFormValues } from "@/schemas/customer.schema";
import { useCreateCustomer } from "@/hooks/use-customers";

export function CustomerForm() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      code: "",
      npwp: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = (values: CustomerFormValues) => {
    createCustomer.mutate(values, {
      onSuccess: () => router.push("/master-data/customer"),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="name"
            label="Nama Customer"
            placeholder="Contoh: PT Maju Bersama"
            error={errors.name?.message}
            {...register("name")}
          />

          <FormField
            id="code"
            label="Kode Customer"
            placeholder="MB-001"
            error={errors.code?.message}
            {...register("code")}
          />

          <FormField
            id="npwp"
            label="NPWP"
            placeholder="11.234.567.8-901.000"
            error={errors.npwp?.message}
            {...register("npwp")}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="finance@perusahaan.co.id"
            error={errors.email?.message}
            {...register("email")}
          />

          <FormField
            id="phone"
            label="No. Telepon (Opsional)"
            placeholder="021-7771234"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <FormField
            id="address"
            label="Alamat"
            placeholder="Jl. Sudirman No. 45, Jakarta Selatan"
            error={errors.address?.message}
            {...register("address")}
          />

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.push("/master-data/customer")}>
              Batal
            </Button>
            <Button type="submit" isLoading={createCustomer.isPending}>
              <Save className="h-4 w-4" />
              Simpan Customer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
