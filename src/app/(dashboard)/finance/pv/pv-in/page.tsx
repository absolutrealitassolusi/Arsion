import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PaymentVoucherTable } from "@/components/modules/payment-vouchers/payment-voucher-table";

export default function PvInPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="PV In"
        description="Payment Voucher untuk penerimaan dari Customer."
        action={
          <Button asChild>
            <Link href="/finance/pv/pv-in/create">
              <Plus className="h-4 w-4" />
              Buat PV In
            </Link>
          </Button>
        }
      />
      <PaymentVoucherTable direction="in" />
    </div>
  );
}
