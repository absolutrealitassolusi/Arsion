"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Archive as ArchiveIcon, ArrowDownLeft, ArrowUpRight } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { usePaymentVouchers } from "@/hooks/use-payment-vouchers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PvStatus } from "@/types/payment-voucher";

const statusMap: Record<PvStatus, { label: string; variant: "secondary" | "default" | "success" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Menunggu Approval", variant: "default" },
  approved: { label: "Disetujui", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  paid: { label: "Dibayar", variant: "success" },
};

/**
 * Read-only - Arsip cuma buat nelusurin histori transaksi operasional,
 * gak ada aksi Edit/Hapus/workflow di sini (itu semua ada di modul
 * Payment Voucher-nya sendiri).
 */
export function PaymentVoucherArchiveTable() {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, isError, error } = usePaymentVouchers({
    search,
    direction: (direction || undefined) as "in" | "out" | undefined,
    status: (status || undefined) as PvStatus | undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Cari no. PV atau nama vendor/customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={direction || "all"} onValueChange={(v) => setDirection(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Arah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Arah</SelectItem>
            <SelectItem value="in">PV In</SelectItem>
            <SelectItem value="out">PV Out</SelectItem>
          </SelectContent>
        </Select>
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
            <TableHead>Arah</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Vendor / Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-destructive">
                  {(error as { message?: string })?.message ?? "Gagal memuat arsip."}
                </TableCell>
              </TableRow>
            )}

            {!isError && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ArchiveIcon className="h-8 w-8" />
                    <p className="text-sm">Belum ada transaksi tercatat.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data?.data.map((voucher) => {
              const st = statusMap[voucher.status];
              return (
                <TableRow key={voucher.id}>
                  <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                  <TableCell>
                    {voucher.direction === "in" ? (
                      <span className="flex items-center gap-1 text-success">
                        <ArrowDownLeft className="h-3.5 w-3.5" /> In
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-primary">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Out
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(voucher.date)}</TableCell>
                  <TableCell>{voucher.partyName}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(voucher.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={`/finance/pv/${voucher.direction === "in" ? "pv-in" : "pv-out"}/${voucher.id}`}
                      >
                        <Eye className="h-4 w-4" /> Lihat
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
