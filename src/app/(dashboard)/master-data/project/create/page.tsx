import { PageHeader } from "@/components/shared/page-header";
import { ProjectForm } from "@/components/modules/projects/project-form";

export default function CreateProjectPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Project" description="Lengkapi data project baru." />
      <ProjectForm />
    </div>
  );
}
