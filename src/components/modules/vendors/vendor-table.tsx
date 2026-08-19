"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Building2 } from "lucide-react";
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
import { useDeleteVendor, useVendors } from "@/hooks/use-vendors";
import { formatDate } from "@/lib/utils";
import type { Vendor, VendorStatus } from "@/types/vendor";

const statusMap: Record<VendorStatus, { label: string; variant: "success" | "secondary" }> = {
  active: { label: "Aktif", variant: "success" },
  inactive: { label: "Nonaktif", variant: "secondary" },
};

export function VendorTable() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const { data, isLoading, isError, error } = useVendors(search);
  const deleteVendor = useDeleteVendor();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteVendor.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Cari nama vendor atau kode..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Vendor</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>NPWP</TableHead>
            <TableHead>No. Telepon</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>Rekening Bank</TableHead>
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
                  {(error as { message?: string })?.message ?? "Gagal memuat data vendor."}
                </TableCell>
              </TableRow>
            )}

            {!isError && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="h-8 w-8" />
                    <p className="text-sm">Tidak ada vendor ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((vendor) => {
              const status = statusMap[vendor.status];
              return (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell className="text-muted-foreground">{vendor.code}</TableCell>
                  <TableCell className="text-muted-foreground">{vendor.npwp}</TableCell>
                  <TableCell>{vendor.phone}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{vendor.address}</TableCell>
                  <TableCell>
                    <p>
                      {vendor.bankName} - {vendor.bankAccountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">a.n. {vendor.bankAccountName}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(vendor.updatedAt)}
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
                          onClick={() => setDeleteTarget(vendor)}
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
        title="Hapus vendor ini?"
        description={`"${deleteTarget?.name}" akan dihapus permanen dan tidak bisa dikembalikan.`}
        onConfirm={confirmDelete}
        isLoading={deleteVendor.isPending}
      />
    </div>
  );
}
