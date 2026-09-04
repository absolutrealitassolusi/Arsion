import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { InvoiceTable } from "@/components/modules/invoices/invoice-table";

export default function InvoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice"
        description="Kelola invoice/tagihan ke customer - Draft, Terkirim, sampai Lunas."
        action={
          <Button asChild>
            <Link href="/finance/invoice/create">
              <Plus className="h-4 w-4" />
              Buat Invoice
            </Link>
          </Button>
        }
      />
      <InvoiceTable />
    </div>
  );
}
