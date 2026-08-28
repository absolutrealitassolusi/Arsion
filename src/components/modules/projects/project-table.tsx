"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, FolderKanban } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteProject, useProjects } from "@/hooks/use-projects";
import { formatDate } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types/project";

const statusMap: Record<ProjectStatus, { label: string; variant: "success" | "secondary" | "default" | "destructive" }> = {
  ongoing: { label: "Berjalan", variant: "success" },
  completed: { label: "Selesai", variant: "secondary" },
  on_hold: { label: "Ditahan", variant: "default" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
};

export function ProjectTable() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const { data, isLoading, isError, error } = useProjects(search);
  const deleteProject = useDeleteProject();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProject.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Cari nama project atau kode..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Project</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Klien</TableHead>
            <TableHead>PIC</TableHead>
            <TableHead>Mulai</TableHead>
            <TableHead>Selesai</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Diperbarui</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <TableSkeleton rows={4} columns={9} />
        ) : (
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-destructive">
                  {(error as { message?: string })?.message ?? "Gagal memuat data project."}
                </TableCell>
              </TableRow>
            )}

            {!isError && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FolderKanban className="h-8 w-8" />
                    <p className="text-sm">Tidak ada project ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((project) => {
              const status = statusMap[project.status];
              return (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell className="text-muted-foreground">{project.code}</TableCell>
                  <TableCell className="text-muted-foreground">{project.clientName}</TableCell>
                  <TableCell className="text-muted-foreground">{project.picName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.startDate ? formatDate(project.startDate) : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.endDate ? formatDate(project.endDate) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(project.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(project)}
                        >
                          <Trash2 className="h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus project ini?"
        description={`"${deleteTarget?.name}" akan dihapus permanen dan tidak bisa dikembalikan.`}
        onConfirm={confirmDelete}
        isLoading={deleteProject.isPending}
      />
    </div>
  );
}
