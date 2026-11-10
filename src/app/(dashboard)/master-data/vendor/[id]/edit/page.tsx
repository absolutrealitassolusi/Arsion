import { PageHeader } from "@/components/shared/page-header";
import { VendorEditLoader } from "@/components/modules/master-data/master-edit-loaders";

interface EditVendorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVendorPage({ params }: EditVendorPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Vendor" description="Ubah data vendor, lalu simpan perubahannya." />
      <VendorEditLoader id={decodeURIComponent(id)} />
    </div>
  );
}
