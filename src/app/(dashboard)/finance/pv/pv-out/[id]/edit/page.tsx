import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherEditForm } from "@/components/modules/payment-vouchers/payment-voucher-edit-form";

interface EditPvOutPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPvOutPage({ params }: EditPvOutPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit PV Out" description="Ubah isi Payment Voucher, lalu simpan sebagai Draft atau ajukan ulang." />
      <PaymentVoucherEditForm voucherId={id} direction="out" />
    </div>
  );
}
