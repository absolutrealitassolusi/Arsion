"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { vendorSchema, type VendorFormValues } from "@/schemas/vendor.schema";
import { useCreateVendor } from "@/hooks/use-vendors";

export function VendorForm() {
  const router = useRouter();
  const createVendor = useCreateVendor();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      code: "",
      npwp: "",
      phone: "",
      address: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
    },
  });

  const onSubmit = (values: VendorFormValues) => {
    createVendor.mutate(values, {
      onSuccess: () => router.push("/master-data/vendor"),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Vendor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="name"
            label="Nama Vendor"
            placeholder="Contoh: PT Sumber Makmur"
            error={errors.name?.message}
            {...register("name")}
          />

          <FormField
            id="code"
            label="Kode Vendor"
            placeholder="SM-001"
            error={errors.code?.message}
            {...register("code")}
          />

          <FormField
            id="npwp"
            label="NPWP"
            placeholder="01.234.567.8-901.000"
            error={errors.npwp?.message}
            {...register("npwp")}
          />

          <FormField
            id="phone"
            label="No. Telepon (Opsional)"
            placeholder="021-5551234"
            error={errors.phone?.message}
            {...register("phone")}
          />

          <FormField
            id="address"
            label="Alamat"
            placeholder="Jl. Gajah Mada No. 20, Jakarta Barat"
            error={errors.address?.message}
            {...register("address")}
          />

          <FormField
            id="bankName"
            label="Nama Bank"
            placeholder="BCA"
            error={errors.bankName?.message}
            {...register("bankName")}
          />

          <FormField
            id="bankAccountNumber"
            label="Nomor Rekening"
            placeholder="1234567890"
            error={errors.bankAccountNumber?.message}
            {...register("bankAccountNumber")}
          />

          <FormField
            id="bankAccountName"
            label="Nama Rekening Bank"
            placeholder="Sesuai nama di buku tabungan"
            error={errors.bankAccountName?.message}
            {...register("bankAccountName")}
          />

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => router.push("/master-data/vendor")}>
              Batal
            </Button>
            <Button type="submit" isLoading={createVendor.isPending}>
              <Save className="h-4 w-4" />
              Simpan Vendor
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
