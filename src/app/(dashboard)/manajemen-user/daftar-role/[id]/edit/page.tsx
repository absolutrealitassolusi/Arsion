import { PageHeader } from "@/components/shared/page-header";
import { RolePermissionForm } from "@/components/modules/roles/role-permission-form";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Role" description="Ubah nama, deskripsi, dan permission role." />
      <RolePermissionForm roleId={id} />
    </div>
  );
}
