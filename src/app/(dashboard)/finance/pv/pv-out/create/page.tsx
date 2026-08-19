import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherForm } from "@/components/modules/payment-vouchers/payment-voucher-form";

export default function CreatePvOutPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buat PV Out" description="Payment Voucher pembayaran ke Vendor, tersimpan sebagai Draft." />
      <PaymentVoucherForm direction="out" />
    </div>
  );
}
