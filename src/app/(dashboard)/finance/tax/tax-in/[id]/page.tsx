import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherDetailTabs } from "@/components/modules/payment-vouchers/payment-voucher-detail-tabs";

export default async function TaxInDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Isi Faktur Pajak" description="Info, Approval, Payment, Tax, dan History dalam satu tempat." />
      <PaymentVoucherDetailTabs voucherId={id} initialTab="tax" />
    </div>
  );
}
