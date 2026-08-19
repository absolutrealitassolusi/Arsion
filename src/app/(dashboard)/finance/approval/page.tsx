import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherWorklistTable } from "@/components/modules/payment-vouchers/payment-voucher-worklist-table";

export default function FinanceApprovalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval"
        description="Payment Voucher (In & Out) yang menunggu approval kamu."
      />
      <PaymentVoucherWorklistTable
        status="submitted"
        basePath="/finance/approval"
        emptyMessage="Tidak ada Payment Voucher yang menunggu approval."
      />
    </div>
  );
}
