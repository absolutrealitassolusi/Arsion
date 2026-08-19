"use client";

import Link from "next/link";
import { Clock, FileWarning, Receipt, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { PvStatus } from "@/types/payment-voucher";

const statusMap: Record<PvStatus, { label: string; variant: "secondary" | "default" | "success" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Menunggu Approval", variant: "default" },
  approved: { label: "Disetujui", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  paid: { label: "Dibayar", variant: "success" },
};

function isSameMonth(dateStr: string, reference: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth();
}

/**
 * Angka & tabel di sini semuanya dihitung langsung dari data PV asli
 * (bukan hardcode lagi). Gak ada "trend vs bulan lalu" - itu butuh query
 * data periode sebelumnya juga, sengaja belum digarap biar cepat & angka
 * yang ditampilkan tetap jujur (dulu itu cuma angka contoh).
 */
export function DashboardOverview() {
  const { data, isLoading } = usePaymentVouchers({});
  const vouchers = data?.data ?? [];
  const now = new Date();

  const totalThisMonth = vouchers.filter((v) => isSameMonth(v.createdAt, now)).length;
  const waitingApproval = vouchers.filter((v) => v.status === "submitted").length;
  // "Invoice belum lunas" = PV Out yang udah disetujui tapi belum ditandai dibayar.
  const unpaidInvoiceAmount = vouchers
    .filter((v) => v.direction === "out" && v.status === "approved")
    .reduce((sum, v) => sum + v.totalAmount, 0);
  // Diperkirakan dari updatedAt PV berstatus "paid" - itu ke-update pas ditandai dibayar.
  const paidThisMonthAmount = vouchers
    .filter((v) => v.status === "paid" && isSameMonth(v.updatedAt, now))
    .reduce((sum, v) => sum + v.totalAmount, 0);

  const recentVouchers = [...vouchers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total PV Bulan Ini" value={String(totalThisMonth)} icon={Receipt} />
        <StatCard label="PV Menunggu Approval" value={String(waitingApproval)} icon={Clock} />
        <StatCard label="Invoice Belum Lunas" value={formatCurrency(unpaidInvoiceAmount)} icon={FileWarning} />
        <StatCard label="Total Pembayaran Bulan Ini" value={formatCurrency(paidThisMonthAmount)} icon={Wallet} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Voucher Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. PV</TableHead>
                <TableHead>Vendor / Customer</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : (
              <TableBody>
                {recentVouchers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Belum ada Payment Voucher.
                    </TableCell>
                  </TableRow>
                )}
                {recentVouchers.map((voucher) => {
                  const status = statusMap[voucher.status];
                  return (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/finance/pv/${voucher.direction === "in" ? "pv-in" : "pv-out"}/${voucher.id}`}
                          className="hover:underline"
                        >
                          {voucher.voucherNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{voucher.partyName}</TableCell>
                      <TableCell>{formatCurrency(voucher.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(voucher.date)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            )}
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
