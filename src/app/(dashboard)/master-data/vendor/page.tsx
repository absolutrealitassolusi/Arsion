import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { VendorTable } from "@/components/modules/vendors/vendor-table";

export default function VendorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor"
        description="Kelola data vendor untuk pembuatan Payment Voucher."
        action={
          <Button asChild>
            <Link href="/master-data/vendor/create">
              <Plus className="h-4 w-4" />
              Tambah Vendor
            </Link>
          </Button>
        }
      />
      <VendorTable />
    </div>
  );
}
