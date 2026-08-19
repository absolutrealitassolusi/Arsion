import { PageHeader } from "@/components/shared/page-header";
import { RoleForm } from "@/components/modules/roles/role-form";

export default function CreateRolePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Role" description="Lengkapi nama dan deskripsi role baru." />
      <RoleForm />
    </div>
  );
}
