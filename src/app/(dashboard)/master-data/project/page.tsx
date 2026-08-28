import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ProjectTable } from "@/components/modules/projects/project-table";

export default function ProjectPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Project"
        description="Kelola data project yang sedang berjalan maupun yang sudah selesai."
        action={
          <Button asChild>
            <Link href="/master-data/project/create">
              <Plus className="h-4 w-4" />
              Tambah Project
            </Link>
          </Button>
        }
      />
      <ProjectTable />
    </div>
  );
}
