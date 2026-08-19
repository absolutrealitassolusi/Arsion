import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherDetailTabs } from "@/components/modules/payment-vouchers/payment-voucher-detail-tabs";

interface PvInDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function PvInDetailPage({ params, searchParams }: PvInDetailPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader title="Detail PV In" description="Info, Approval, Payment, Tax, dan History dalam satu tempat." />
      <PaymentVoucherDetailTabs voucherId={id} initialTab={tab} />
    </div>
  );
}
