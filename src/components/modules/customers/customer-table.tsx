"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
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
import { useDeleteCustomer, useCustomers } from "@/hooks/use-customers";
import { formatDate } from "@/lib/utils";
import type { Customer, CustomerStatus } from "@/types/customer";

const statusMap: Record<CustomerStatus, { label: string; variant: "success" | "secondary" }> = {
  active: { label: "Aktif", variant: "success" },
  inactive: { label: "Nonaktif", variant: "secondary" },
};

export function CustomerTable() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const { data, isLoading, isError, error } = useCustomers(search);
  const deleteCustomer = useDeleteCustomer();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteCustomer.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Cari nama customer atau kode..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Customer</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>NPWP</TableHead>
            <TableHead>Kontak</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Diperbarui</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <TableSkeleton rows={3} columns={8} />
        ) : (
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-destructive">
                  {(error as { message?: string })?.message ?? "Gagal memuat data customer."}
                </TableCell>
              </TableRow>
            )}

            {!isError && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p className="text-sm">Tidak ada customer ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((customer) => {
              const status = statusMap[customer.status];
              return (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.code}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.npwp}</TableCell>
                  <TableCell>
                    <p>{customer.phone}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {customer.address}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(customer.updatedAt)}
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
                          onClick={() => setDeleteTarget(customer)}
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
        title="Hapus customer ini?"
        description={`"${deleteTarget?.name}" akan dihapus permanen dan tidak bisa dikembalikan.`}
        onConfirm={confirmDelete}
        isLoading={deleteCustomer.isPending}
      />
    </div>
  );
}
