import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherDetailTabs } from "@/components/modules/payment-vouchers/payment-voucher-detail-tabs";

interface PvOutDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function PvOutDetailPage({ params, searchParams }: PvOutDetailPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader title="Detail PV Out" description="Info, Approval, Payment, Tax, dan History dalam satu tempat." />
      <PaymentVoucherDetailTabs voucherId={id} initialTab={tab} />
    </div>
  );
}
