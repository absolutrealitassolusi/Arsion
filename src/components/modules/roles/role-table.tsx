"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2, ShieldOff } from "lucide-react";
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
import { useDeleteRole, useRoles } from "@/hooks/use-roles";
import type { Role } from "@/types/role";

/**
 * "Lihat" (read-only) dan "Edit" mengarah ke halaman berbeda tapi
 * berbagi komponen form yang sama (RolePermissionForm dengan prop
 * `readOnly`) - lihat penjelasan di role-permission-form.tsx.
 */
export function RoleTable() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const { data, isLoading, isError, error } = useRoles(search);
  const deleteRole = useDeleteRole();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteRole.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Cari nama role..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Role</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Jumlah User</TableHead>
            <TableHead>Jumlah Permission</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : (
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-destructive">
                  {(error as { message?: string })?.message ?? "Gagal memuat data role."}
                </TableCell>
              </TableRow>
            )}

            {!isError && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ShieldOff className="h-8 w-8" />
                    <p className="text-sm">Tidak ada role ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="text-muted-foreground">{role.description}</TableCell>
                <TableCell>{role.userCount}</TableCell>
                <TableCell>
                  <Badge variant="outline">{role.permissions.length} permission</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/manajemen-user/daftar-role/${role.id}`}>
                          <Eye className="h-4 w-4" /> Lihat
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/manajemen-user/daftar-role/${role.id}/edit`}>
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(role)}
                      >
                        <Trash2 className="h-4 w-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus role ini?"
        description={`"${deleteTarget?.name}" akan dihapus permanen dan tidak bisa dikembalikan.`}
        onConfirm={confirmDelete}
        isLoading={deleteRole.isPending}
      />
    </div>
  );
}
