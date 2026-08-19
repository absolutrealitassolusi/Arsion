import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherForm } from "@/components/modules/payment-vouchers/payment-voucher-form";

export default function CreatePvInPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buat PV In" description="Payment Voucher penerimaan dari Customer, tersimpan sebagai Draft." />
      <PaymentVoucherForm direction="in" />
    </div>
  );
}
