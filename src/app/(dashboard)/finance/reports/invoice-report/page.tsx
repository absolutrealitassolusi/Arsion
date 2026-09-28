import { PageHeader } from "@/components/shared/page-header";
import { InvoiceReport } from "@/components/modules/invoices/invoice-report";

export default function InvoiceReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Invoice Report" description="Ringkasan seluruh Invoice berdasarkan status." />
      <InvoiceReport />
    </div>
  );
}
