import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherWorklistTable } from "@/components/modules/payment-vouchers/payment-voucher-worklist-table";

export default function FinancePaymentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment"
        description="Payment Voucher (In & Out) yang sudah disetujui, siap diproses pembayarannya."
      />
      <PaymentVoucherWorklistTable
        status="approved"
        basePath="/finance/payment"
        emptyMessage="Tidak ada Payment Voucher yang siap dibayar."
      />
    </div>
  );
}
