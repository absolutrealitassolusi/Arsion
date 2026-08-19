import { PageHeader } from "@/components/shared/page-header";
import { PaymentVoucherWorklistTable } from "@/components/modules/payment-vouchers/payment-voucher-worklist-table";

export default function TaxInPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax In"
        description="PV In yang sudah dibayar tapi Faktur Pajak-nya belum diisi."
      />
      <PaymentVoucherWorklistTable
        status="paid"
        direction="in"
        basePath="/finance/tax/tax-in"
        onlyMissingTaxInvoice
        emptyMessage="Tidak ada PV In yang perlu diisi Faktur Pajak-nya."
      />
    </div>
  );
}
