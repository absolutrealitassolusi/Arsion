import { PageHeader } from "@/components/shared/page-header";
import { InvoiceEditForm } from "@/components/modules/invoices/invoice-edit-form";

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Invoice" description="Ubah isi invoice, lalu simpan perubahan." />
      <InvoiceEditForm invoiceId={id} />
    </div>
  );
}
