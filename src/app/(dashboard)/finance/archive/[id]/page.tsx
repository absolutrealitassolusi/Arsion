import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherDetailTabs } from "@/components/modules/payment-vouchers/payment-voucher-detail-tabs";

export default async function ArchiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Detail Payment Voucher" description="Info, Approval, Payment, Tax, dan History dalam satu tempat." />
      <PaymentVoucherDetailTabs voucherId={id} initialTab="info" backToListPath="/finance/archive" />
    </div>
  );
}
