import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/components/modules/invoices/invoice-form";

export default function CreateInvoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buat Invoice" description="Lengkapi data invoice baru untuk customer." />
      <InvoiceForm />
    </div>
  );
}
