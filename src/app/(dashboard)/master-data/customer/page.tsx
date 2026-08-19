import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CustomerTable } from "@/components/modules/customers/customer-table";

export default function CustomerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer"
        description="Kelola data customer untuk penagihan invoice."
        action={
          <Button asChild>
            <Link href="/master-data/customer/create">
              <Plus className="h-4 w-4" />
              Tambah Customer
            </Link>
          </Button>
        }
      />
      <CustomerTable />
    </div>
  );
}
