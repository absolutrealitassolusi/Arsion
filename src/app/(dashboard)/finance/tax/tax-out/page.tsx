import { PageHeader } from "@/components/shared/page-header";
import { TaxQueue } from "@/components/modules/payment-vouchers/tax-queue";

export default function TaxOutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Out"
        description="PV Out yang sudah dibayar dan kena pajak - lengkapi Faktur Pajak (PPN) dan Bukti Potong (PPh)."
      />
      <TaxQueue direction="out" />
    </div>
  );
}
