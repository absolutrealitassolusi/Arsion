import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PaymentVoucherTable } from "@/components/modules/payment-vouchers/payment-voucher-table";

export default function PvOutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="PV Out"
        description="Payment Voucher untuk pembayaran ke Vendor."
        action={
          <Button asChild>
            <Link href="/finance/pv/pv-out/create">
              <Plus className="h-4 w-4" />
              Buat PV Out
            </Link>
          </Button>
        }
      />
      <PaymentVoucherTable direction="out" />
    </div>
  );
}
