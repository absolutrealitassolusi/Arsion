import { PageHeader } from "@/components/shared/page-header";
import { CustomerEditLoader } from "@/components/modules/master-data/master-edit-loaders";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Customer" description="Ubah data customer, lalu simpan perubahannya." />
      <CustomerEditLoader id={decodeURIComponent(id)} />
    </div>
  );
}
