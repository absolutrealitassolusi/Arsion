import { PageHeader } from "@/components/shared/page-header";
import { VendorForm } from "@/components/modules/vendors/vendor-form";

export default function CreateVendorPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Vendor" description="Lengkapi data vendor baru." />
      <VendorForm />
    </div>
  );
}
