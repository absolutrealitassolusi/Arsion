"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { companySchema, type CompanyFormValues } from "@/schemas/company.schema";
import { useCompany, useUpdateCompany } from "@/hooks/use-company";
import { useHasPermission } from "@/hooks/use-has-permission";
import { PERMISSIONS } from "@/config/permissions";

const emptyValues: CompanyFormValues = { name: "", address: "", npwp: "", phone: "", email: "" };

export function CompanyForm() {
  const { data, isLoading } = useCompany();
  const updateCompany = useUpdateCompany();
  const canEdit = useHasPermission(PERMISSIONS.MASTER_DATA_COMPANY);
  const company = data?.data;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    // `values` (bukan `defaultValues`) - react-hook-form otomatis nge-reset
    // form tiap kali object ini berubah, jadi form ke-isi ulang begitu data
    // dari server kelar di-fetch, tanpa perlu useEffect manual.
    values: company
      ? {
          name: company.name,
          address: company.address,
          npwp: company.npwp,
          phone: company.phone,
          email: company.email,
        }
      : emptyValues,
  });

  const onSubmit = (values: CompanyFormValues) => {
    updateCompany.mutate(values);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Memuat data perusahaan...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Perusahaan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              id="name"
              label="Nama Perusahaan"
              placeholder="PT. Nama Perusahaan"
              disabled={!canEdit}
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              rows={3}
              placeholder={"Jl. Contoh No. 1\nJakarta Selatan 12345"}
              disabled={!canEdit}
              {...register("address")}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <FormField
            id="npwp"
            label="NPWP"
            placeholder="01.234.567.8-901.000"
            disabled={!canEdit}
            error={errors.npwp?.message}
            {...register("npwp")}
          />

          <FormField
            id="phone"
            label="Telepon"
            placeholder="021-5551234"
            disabled={!canEdit}
            error={errors.phone?.message}
            {...register("phone")}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="info@perusahaan.com"
            disabled={!canEdit}
            error={errors.email?.message}
            {...register("email")}
          />

          {canEdit ? (
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" isLoading={updateCompany.isPending}>
                <Save className="h-4 w-4" />
                Simpan
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Kamu tidak punya izin buat mengubah data perusahaan.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
