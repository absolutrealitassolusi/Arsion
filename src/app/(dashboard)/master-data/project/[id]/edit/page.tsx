import { PageHeader } from "@/components/shared/page-header";
import { ProjectEditLoader } from "@/components/modules/master-data/master-edit-loaders";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Project" description="Ubah data project, lalu simpan perubahannya." />
      <ProjectEditLoader id={decodeURIComponent(id)} />
    </div>
  );
}
