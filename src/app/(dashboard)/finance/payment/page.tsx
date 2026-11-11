import { PageHeader } from "@/components/shared/page-header";
import { PaymentQueue } from "@/components/modules/payment-vouchers/payment-queue";

export default function FinancePaymentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment"
        description="Payment Voucher (In & Out) yang sudah disetujui, siap diproses pembayarannya."
      />
      <PaymentQueue />
    </div>
  );
}
