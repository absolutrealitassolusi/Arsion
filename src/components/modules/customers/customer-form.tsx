"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { customerSchema, type CustomerFormValues } from "@/schemas/customer.schema";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import { useNextMasterCode } from "@/hooks/use-next-master-code";
import type { Customer } from "@/types/customer";

interface CustomerFormProps {
  /** Diisi = mode Edit (lihat /master-data/customer/[id]/edit). */
  editCustomer?: Customer;
}

export function CustomerForm({ editCustomer }: CustomerFormProps) {
  const router = useRouter();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer(editCustomer?.id ?? "");
  const nextCode = useNextMasterCode("customer", !editCustomer);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: editCustomer
      ? {
          name: editCustomer.name,
          code: editCustomer.code,
          npwp: editCustomer.npwp,
          email: editCustomer.email,
          phone: editCustomer.phone ?? "",
          address: editCustomer.address,
          bankName: editCustomer.bankName,
          bankAccountNumber: editCustomer.bankAccountNumber,
          bankAccountName: editCustomer.bankAccountName,
        }
      : {
          name: "",
          code: "",
          npwp: "",
          email: "",
          phone: "",
          address: "",
          bankName: "",
          bankAccountNumber: "",
          bankAccountName: "",
        },
  });

  // Kode otomatis (+1 dari kode terakhir) - cuma diisi kalau user belum ngetik kode sendiri.
  useEffect(() => {
    if (nextCode.data && !getValues("code")) setValue("code", nextCode.data);
  }, [nextCode.data, getValues, setValue]);

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  const onSubmit = (values: CustomerFormValues) => {
    const onSuccess = () => router.push("/master-data/customer");
    if (editCustomer) updateCustomer.mutate(values, { onSuccess });
    else createCustomer.mutate(values, { onSuccess });
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
            placeholder={nextCode.isFetching ? "Memuat kode..." : "Kosongkan untuk kode otomatis"}
            error={errors.code?.message}
            {...register("code")}
          />

          <FormField
            id="npwp"
            label="NPWP (Opsional)"
            placeholder="11.234.567.8-901.000"
            error={errors.npwp?.message}
            {...register("npwp")}
          />

          <FormField
            id="email"
            label="Email (Opsional)"
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
            label="Alamat (Opsional)"
            placeholder="Jl. Sudirman No. 45, Jakarta Selatan"
            error={errors.address?.message}
            {...register("address")}
          />

          <div className="space-y-1 border-t pt-6 sm:col-span-2">
            <h3 className="text-sm font-semibold">Rekening Customer</h3>
            <p className="text-xs text-muted-foreground">
              Dipakai untuk mengisi otomatis rekening pengirim saat membuat PV In.
            </p>
          </div>

          <FormField
            id="bankName"
            label="Nama Bank (Opsional)"
            placeholder="BCA"
            error={errors.bankName?.message}
            {...register("bankName")}
          />

          <FormField
            id="bankAccountNumber"
            label="Nomor Rekening (Opsional)"
            placeholder="1234567890"
            error={errors.bankAccountNumber?.message}
            {...register("bankAccountNumber")}
          />

          <FormField
            id="bankAccountName"
            label="Nama Rekening Bank (Opsional)"
            placeholder="Sesuai nama di buku tabungan"
            error={errors.bankAccountName?.message}
            {...register("bankAccountName")}
          />

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.push("/master-data/customer")}>
              Batal
            </Button>
            <Button type="submit" isLoading={isPending}>
              <Save className="h-4 w-4" />
              {editCustomer ? "Simpan Perubahan" : "Simpan Customer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
