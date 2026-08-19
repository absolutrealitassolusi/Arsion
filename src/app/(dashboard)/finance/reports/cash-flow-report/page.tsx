import { PageHeader } from "@/components/shared/page-header";
import { CashFlowReport } from "@/components/modules/payment-vouchers/cash-flow-report";

export default function CashFlowReportPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Cash Flow Report" description="Perbandingan uang masuk dan keluar dari Payment Voucher yang sudah dibayar." />
      <CashFlowReport />
    </div>
  );
}
