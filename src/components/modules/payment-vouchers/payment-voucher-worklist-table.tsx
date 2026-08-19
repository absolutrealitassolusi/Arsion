"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Inbox } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { usePaymentVouchers } from "@/hooks/use-payment-vouchers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PvDirection, PvStatus } from "@/types/payment-voucher";

interface PaymentVoucherWorklistTableProps {
  /** Status yang dicari - worklist ini selalu terkunci ke 1 status. */
  status: PvStatus;
  /** Kalau diisi, kunci ke 1 arah aja (dipakai buat Tax In/Tax Out). */
  direction?: PvDirection;
  /**
   * Route detail milik worklist ini sendiri (misal "/finance/approval"),
   * BUKAN /finance/pv/pv-in|pv-out - supaya URL & Sidebar tetap konsisten
   * nunjukin kamu lagi di worklist ini, bukan "lompat" ke menu PV.
   */
  basePath: string;
  emptyMessage: string;
  /**
   * Cuma tampilin PV yang Faktur Pajak-nya belum diisi (dipakai buat Tax In/Out).
   * Sengaja boolean, bukan fungsi - fungsi gak bisa dioper dari Server Component
   * (halaman page.tsx) ke Client Component ini.
   */
  onlyMissingTaxInvoice?: boolean;
}

export function PaymentVoucherWorklistTable({
  status,
  direction,
  basePath,
  emptyMessage,
  onlyMissingTaxInvoice,
}: PaymentVoucherWorklistTableProps) {
  const { data, isLoading, isError, error } = usePaymentVouchers({ status, direction });
  const vouchers = (data?.data ?? []).filter((v) => (onlyMissingTaxInvoice ? !v.taxInvoiceNumber : true));

  const columnCount = direction ? 5 : 6;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. PV</TableHead>
          {!direction && <TableHead>Arah</TableHead>}
          <TableHead>Tanggal</TableHead>
          <TableHead>Vendor / Customer</TableHead>
          <TableHead>Total</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>

      {isLoading ? (
        <TableSkeleton rows={4} columns={columnCount} />
      ) : (
        <TableBody>
          {isError && (
            <TableRow>
              <TableCell colSpan={columnCount} className="py-10 text-center text-sm text-destructive">
                {(error as { message?: string })?.message ?? "Gagal memuat data."}
              </TableCell>
            </TableRow>
          )}

          {!isError && vouchers.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnCount} className="py-14 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Inbox className="h-8 w-8" />
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          )}

          {vouchers.map((voucher) => {
            return (
              <TableRow key={voucher.id}>
                <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                {!direction && (
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
                )}
                <TableCell className="text-muted-foreground">{formatDate(voucher.date)}</TableCell>
                <TableCell>{voucher.partyName}</TableCell>
                <TableCell className="font-medium">{formatCurrency(voucher.totalAmount)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`${basePath}/${voucher.id}`} className="text-sm font-medium text-primary hover:underline">
                    Proses →
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      )}
    </Table>
  );
}
