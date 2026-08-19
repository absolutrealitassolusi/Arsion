import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { RoleTable } from "@/components/modules/roles/role-table";

export default function DaftarRolePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Daftar Role"
        description="Kelola nama & deskripsi role. Assign permission per-role belum tersedia."
        action={
          <Button asChild>
            <Link href="/manajemen-user/daftar-role/create">
              <Plus className="h-4 w-4" />
              Tambah Role
            </Link>
          </Button>
        }
      />
      <RoleTable />
    </div>
  );
}
