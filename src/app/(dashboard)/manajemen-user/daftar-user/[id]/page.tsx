import { PageHeader } from "@/components/shared/page-header";
import { UserDetailTabs } from "@/components/modules/users/user-detail-tabs";

export default async function ViewUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Detail User" description="Informasi lengkap, role, dan permission user." />
      <UserDetailTabs userId={id} />
    </div>
  );
}
