import { PageHeader } from "@/components/shared/page-header";
import { VoucherReport } from "@/components/modules/payment-vouchers/voucher-report";

export default function VoucherReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Voucher Report" description="Ringkasan seluruh Payment Voucher berdasarkan status." />
      <VoucherReport />
    </div>
  );
}
