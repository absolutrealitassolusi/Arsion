"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, Trash2, Receipt } from "lucide-react";
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
import { useDeleteInvoice, useInvoices } from "@/hooks/use-invoices";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types/invoice";

const statusMap: Record<InvoiceStatus, { label: string; variant: "success" | "secondary" | "default" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Terkirim", variant: "default" },
  paid: { label: "Lunas", variant: "success" },
};

export function InvoiceTable() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const { data, isLoading, isError, error } = useInvoices({ search });
  const deleteInvoice = useDeleteInvoice();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteInvoice.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Cari nomor invoice atau customer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <TableSkeleton rows={4} columns={7} />
        ) : (
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-destructive">
                  {(error as { message?: string })?.message ?? "Gagal memuat data invoice."}
                </TableCell>
              </TableRow>
            )}

            {!isError && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Receipt className="h-8 w-8" />
                    <p className="text-sm">Tidak ada invoice ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((invoice) => {
              const status = statusMap[invoice.status];
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customerName}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(invoice.date)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {invoice.isOverdue && <Badge variant="destructive">Jatuh Tempo</Badge>}
                    </div>
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
                          <Link href={`/finance/invoice/${invoice.id}`}>
                            <Eye className="h-4 w-4" /> Lihat
                          </Link>
                        </DropdownMenuItem>
                        {invoice.status === "draft" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(invoice)}
                          >
                            <Trash2 className="h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        )}
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
        title="Hapus invoice ini?"
        description={`"${deleteTarget?.invoiceNumber}" akan dihapus permanen dan tidak bisa dikembalikan.`}
        onConfirm={confirmDelete}
        isLoading={deleteInvoice.isPending}
      />
    </div>
  );
}
