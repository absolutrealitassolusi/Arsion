import { PageHeader } from "@/components/shared/page-header";
import { InvoiceDetail } from "@/components/modules/invoices/invoice-detail";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Detail Invoice" description="Info, status, dan riwayat invoice." />
      <InvoiceDetail invoiceId={id} backToListPath="/finance/invoice" />
    </div>
  );
}
