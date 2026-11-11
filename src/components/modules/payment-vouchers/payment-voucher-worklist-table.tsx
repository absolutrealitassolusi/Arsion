"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Inbox, Paperclip } from "lucide-react";
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
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  PAYMENT_METHOD_LABELS,
  pvTaxStatus,
  type PaymentVoucher,
  type PvDirection,
  type PvStatus,
} from "@/types/payment-voucher";

/** Ringkas status dokumen pajak per PV, mis. "Faktur ✓ · Bupot ✗". */
function TaxDocsCell({ voucher }: { voucher: PaymentVoucher }) {
  const tax = pvTaxStatus(voucher, voucher.withholdingProofCount ?? 0);
  const part = (label: string, done: boolean) => (
    <span className={done ? "text-success" : "text-destructive"}>
      {label} {done ? "✓" : "✗"}
    </span>
  );
  return (
    <span className="flex flex-wrap items-center gap-x-2 text-xs font-medium">
      {tax.needsFaktur && part("Faktur", tax.hasFaktur)}
      {tax.needsFaktur && tax.needsBupot && <span className="text-muted-foreground">·</span>}
      {tax.needsBupot && part("Bupot", tax.hasBupot)}
    </span>
  );
}

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
   * Mode Tax In/Out: cuma PV yang kena pajak, disaring berdasarkan
   * kelengkapan dokumennya (lihat pvTaxStatus). Kolom Bank & Lampiran
   * diganti kolom PPN, PPh, dan status dokumen.
   */
  taxFilter?: "incomplete" | "complete";
  /** Tampilkan kolom Metode Pembayaran (dipakai di menu Payment). */
  showPaymentMethod?: boolean;
  /** Tampilkan kolom Tanggal Dibayar & urutkan dari yang terakhir dibayar. */
  showPaidAt?: boolean;
}

export function PaymentVoucherWorklistTable({
  status,
  direction,
  basePath,
  emptyMessage,
  taxFilter,
  showPaymentMethod,
  showPaidAt,
}: PaymentVoucherWorklistTableProps) {
  const { data, isLoading, isError, error } = usePaymentVouchers({ status, direction });
  const taxMode = Boolean(taxFilter);
  const filtered = (data?.data ?? []).filter((v) => {
    if (!taxFilter) return true;
    const tax = pvTaxStatus(v, v.withholdingProofCount ?? 0);
    return tax.required && (taxFilter === "complete" ? tax.complete : !tax.complete);
  });
  const vouchers = showPaidAt
    ? [...filtered].sort((a, b) => new Date(b.paidAt ?? b.updatedAt).getTime() - new Date(a.paidAt ?? a.updatedAt).getTime())
    : filtered;

  // No, Tanggal, Party, Total, Aksi + (Bank, Lampiran) atau (PPN, PPh, Dokumen).
  const columnCount =
    5 + (taxMode ? 3 : 2) + (direction ? 0 : 1) + (showPaymentMethod ? 1 : 0) + (showPaidAt ? 1 : 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. PV</TableHead>
          {!direction && <TableHead>Arah</TableHead>}
          <TableHead>Tanggal</TableHead>
          <TableHead>Vendor / Customer</TableHead>
          {!taxMode && <TableHead>Bank Pengirim</TableHead>}
          {showPaymentMethod && <TableHead>Metode</TableHead>}
          {!taxMode && <TableHead>Lampiran</TableHead>}
          {taxMode && <TableHead>PPN</TableHead>}
          {taxMode && <TableHead>PPh</TableHead>}
          {taxMode && <TableHead>Dokumen</TableHead>}
          <TableHead>Total</TableHead>
          {showPaidAt && <TableHead>Tanggal Dibayar</TableHead>}
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
                <TableCell className="max-w-xs">
                  <p>{voucher.partyName}</p>
                  {voucher.description && (
                    <p className="truncate text-xs text-muted-foreground" title={voucher.description}>
                      {voucher.description}
                    </p>
                  )}
                </TableCell>
                {!taxMode && <TableCell className="text-muted-foreground">{voucher.senderBank || "-"}</TableCell>}
                {showPaymentMethod && (
                  <TableCell className="text-muted-foreground">{PAYMENT_METHOD_LABELS[voucher.paymentMethod]}</TableCell>
                )}
                {!taxMode && (
                  <TableCell className="text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" /> {voucher.attachmentCount ?? 0}
                    </span>
                  </TableCell>
                )}
                {taxMode && <TableCell>{voucher.ppnAmount > 0 ? formatCurrency(voucher.ppnAmount) : "-"}</TableCell>}
                {taxMode && (
                  <TableCell>
                    {voucher.pphJasaAmount + voucher.pphFreelanceAmount > 0
                      ? formatCurrency(voucher.pphJasaAmount + voucher.pphFreelanceAmount)
                      : "-"}
                  </TableCell>
                )}
                {taxMode && (
                  <TableCell>
                    <TaxDocsCell voucher={voucher} />
                  </TableCell>
                )}
                <TableCell className="font-medium">{formatCurrency(voucher.totalAmount)}</TableCell>
                {showPaidAt && (
                  <TableCell className="text-muted-foreground">
                    {voucher.paidAt ? formatDateTime(voucher.paidAt) : "-"}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <Link href={`${basePath}/${voucher.id}`} className="text-sm font-medium text-primary hover:underline">
                    {showPaidAt || taxFilter === "complete" ? "Lihat →" : "Proses →"}
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
