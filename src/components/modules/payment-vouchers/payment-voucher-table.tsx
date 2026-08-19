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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePaymentVouchers, useDeletePaymentVoucher } from "@/hooks/use-payment-vouchers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentVoucher, PvDirection, PvStatus } from "@/types/payment-voucher";

interface PaymentVoucherTableProps {
  direction: PvDirection;
}

const statusMap: Record<PvStatus, { label: string; variant: "secondary" | "default" | "success" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Menunggu Approval", variant: "default" },
  approved: { label: "Disetujui", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  paid: { label: "Dibayar", variant: "success" },
};

export function PaymentVoucherTable({ direction }: PaymentVoucherTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PaymentVoucher | null>(null);

  const basePath = direction === "in" ? "/finance/pv/pv-in" : "/finance/pv/pv-out";

  const { data, isLoading, isError, error } = usePaymentVouchers({
    direction,
    search,
    status: (status || undefined) as PvStatus | undefined,
  });
  const deleteVoucher = useDeletePaymentVoucher();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteVoucher.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Cari no. PV atau nama vendor/customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Menunggu Approval</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
            <SelectItem value="paid">Dibayar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. PV</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>{direction === "out" ? "Vendor" : "Customer"}</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <TableSkeleton rows={3} columns={7} />
        ) : (
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-destructive">
                  {(error as { message?: string })?.message ?? "Gagal memuat data Payment Voucher."}
                </TableCell>
              </TableRow>
            )}

            {!isError && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Receipt className="h-8 w-8" />
                    <p className="text-sm">Belum ada Payment Voucher.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((voucher) => {
              const st = statusMap[voucher.status];
              return (
                <TableRow key={voucher.id}>
                  <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(voucher.date)}</TableCell>
                  <TableCell>{voucher.partyName}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {voucher.description}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(voucher.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={st.variant}>{st.label}</Badge>
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
                          <Link href={`${basePath}/${voucher.id}`}>
                            <Eye className="h-4 w-4" /> Lihat
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(voucher)}
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
        title="Hapus Payment Voucher ini?"
        description={`"${deleteTarget?.voucherNumber}" akan dihapus permanen dan tidak bisa dikembalikan.`}
        onConfirm={confirmDelete}
        isLoading={deleteVoucher.isPending}
      />
    </div>
  );
}
