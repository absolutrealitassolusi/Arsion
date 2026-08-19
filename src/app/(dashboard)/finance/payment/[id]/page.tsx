import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherDetailTabs } from "@/components/modules/payment-vouchers/payment-voucher-detail-tabs";

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Proses Payment" description="Info, Approval, Payment, Tax, dan History dalam satu tempat." />
      <PaymentVoucherDetailTabs voucherId={id} initialTab="payment" backToListPath="/finance/payment" />
    </div>
  );
}
