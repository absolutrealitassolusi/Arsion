"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { vendorSchema, type VendorFormValues } from "@/schemas/vendor.schema";
import { useCreateVendor, useUpdateVendor } from "@/hooks/use-vendors";
import { useNextMasterCode } from "@/hooks/use-next-master-code";
import type { Vendor } from "@/types/vendor";

interface VendorFormProps {
  /** Diisi = mode Edit (lihat /master-data/vendor/[id]/edit). */
  editVendor?: Vendor;
}

export function VendorForm({ editVendor }: VendorFormProps) {
  const router = useRouter();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor(editVendor?.id ?? "");
  const nextCode = useNextMasterCode("vendor", !editVendor);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: editVendor
      ? {
          name: editVendor.name,
          code: editVendor.code,
          npwp: editVendor.npwp,
          phone: editVendor.phone ?? "",
          address: editVendor.address,
          bankName: editVendor.bankName,
          bankAccountNumber: editVendor.bankAccountNumber,
          bankAccountName: editVendor.bankAccountName,
        }
      : {
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

  // Kode otomatis (+1 dari kode terakhir) - cuma diisi kalau user belum ngetik kode sendiri.
  useEffect(() => {
    if (nextCode.data && !getValues("code")) setValue("code", nextCode.data);
  }, [nextCode.data, getValues, setValue]);

  const isPending = createVendor.isPending || updateVendor.isPending;

  const onSubmit = (values: VendorFormValues) => {
    const onSuccess = () => router.push("/master-data/vendor");
    if (editVendor) updateVendor.mutate(values, { onSuccess });
    else createVendor.mutate(values, { onSuccess });
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
            placeholder={nextCode.isFetching ? "Memuat kode..." : "Kosongkan untuk kode otomatis"}
            error={errors.code?.message}
            {...register("code")}
          />

          <FormField
            id="npwp"
            label="NPWP (Opsional)"
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
            label="Alamat (Opsional)"
            placeholder="Jl. Gajah Mada No. 20, Jakarta Barat"
            error={errors.address?.message}
            {...register("address")}
          />

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
            <Button type="button" variant="outline" onClick={() => router.push("/master-data/vendor")}>
              Batal
            </Button>
            <Button type="submit" isLoading={isPending}>
              <Save className="h-4 w-4" />
              {editVendor ? "Simpan Perubahan" : "Simpan Vendor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
