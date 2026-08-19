import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherArchiveTable } from "@/components/modules/payment-vouchers/payment-voucher-archive-table";

export default function FinanceArchivePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Archive"
        description="Riwayat seluruh transaksi operasional Finance (read-only)."
      />
      <PaymentVoucherArchiveTable />
    </div>
  );
}
