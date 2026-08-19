import { PageHeader } from "@/components/shared/page-header";
import { TaxReport } from "@/components/modules/payment-vouchers/tax-report";

export default function TaxReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tax Report" description="Ringkasan PPN & PPh dari seluruh Payment Voucher." />
      <TaxReport />
    </div>
  );
}
