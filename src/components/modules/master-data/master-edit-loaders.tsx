"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useVendor } from "@/hooks/use-vendors";
import { useCustomer } from "@/hooks/use-customers";
import { useProject } from "@/hooks/use-projects";
import { VendorForm } from "@/components/modules/vendors/vendor-form";
import { CustomerForm } from "@/components/modules/customers/customer-form";
import { ProjectForm } from "@/components/modules/projects/project-form";

/**
 * Ambil datanya dulu baru render form dalam mode Edit - defaultValues form
 * di-set sekali pas mount, jadi harus nunggu data asli kebaca (pola yang
 * sama dengan PaymentVoucherEditForm).
 */
function Message({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">{children}</CardContent>
    </Card>
  );
}

export function VendorEditLoader({ id }: { id: string }) {
  const { data, isLoading, isError } = useVendor(id);
  if (isLoading) return <Message>Memuat data vendor...</Message>;
  if (isError || !data?.data) return <Message>Vendor tidak ditemukan.</Message>;
  return <VendorForm editVendor={data.data} />;
}

export function CustomerEditLoader({ id }: { id: string }) {
  const { data, isLoading, isError } = useCustomer(id);
  if (isLoading) return <Message>Memuat data customer...</Message>;
  if (isError || !data?.data) return <Message>Customer tidak ditemukan.</Message>;
  return <CustomerForm editCustomer={data.data} />;
}

export function ProjectEditLoader({ id }: { id: string }) {
  const { data, isLoading, isError } = useProject(id);
  if (isLoading) return <Message>Memuat data project...</Message>;
  if (isError || !data?.data) return <Message>Project tidak ditemukan.</Message>;
  if (data.data.status === "archived") {
    return <Message>Project ini diarsipkan - aktifkan kembali dulu sebelum mengedit.</Message>;
  }
  return <ProjectForm editProject={data.data} />;
}
