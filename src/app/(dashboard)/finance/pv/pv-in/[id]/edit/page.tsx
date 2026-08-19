import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherEditForm } from "@/components/modules/payment-vouchers/payment-voucher-edit-form";

interface EditPvInPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPvInPage({ params }: EditPvInPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit PV In" description="Ubah isi Payment Voucher, lalu simpan sebagai Draft atau ajukan ulang." />
      <PaymentVoucherEditForm voucherId={id} direction="in" />
    </div>
  );
}
