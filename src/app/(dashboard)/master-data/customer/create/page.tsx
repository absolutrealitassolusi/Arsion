import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/modules/customers/customer-form";

export default function CreateCustomerPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Customer" description="Lengkapi data customer baru." />
      <CustomerForm />
    </div>
  );
}
