"use client";

import { Percent, TrendingUp, TrendingDown } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { usePaymentVouchers } from "@/hooks/use-payment-vouchers";
import { formatCurrency, formatDate } from "@/lib/utils";

export function TaxReport() {
  const { data, isLoading } = usePaymentVouchers({});
  const vouchers = data?.data ?? [];

  const totalPpn = vouchers.reduce((sum, v) => sum + v.ppnAmount, 0);
  const totalPphJasa = vouchers.reduce((sum, v) => sum + v.pphJasaAmount, 0);
  const totalPphFreelance = vouchers.reduce((sum, v) => sum + v.pphFreelanceAmount, 0);

  const taxedVouchers = vouchers.filter(
    (v) => v.ppnAmount > 0 || v.pphJasaAmount > 0 || v.pphFreelanceAmount > 0
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Memuat data laporan...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total PPN Dipungut" value={formatCurrency(totalPpn)} icon={Percent} />
        <StatCard label="Total PPh 23 Dipotong" value={formatCurrency(totalPphJasa)} icon={TrendingDown} />
        <StatCard label="Total PPh 21 Dipotong" value={formatCurrency(totalPphFreelance)} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Pajak per Payment Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. PV</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Vendor / Customer</TableHead>
                <TableHead>Faktur Pajak</TableHead>
                <TableHead className="text-right">PPN</TableHead>
                <TableHead className="text-right">PPh 23</TableHead>
                <TableHead className="text-right">PPh 21</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxedVouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada Payment Voucher dengan pajak.
                  </TableCell>
                </TableRow>
              )}
              {taxedVouchers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.voucherNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(v.date)}</TableCell>
                  <TableCell>{v.partyName}</TableCell>
                  <TableCell className="text-muted-foreground">{v.taxInvoiceNumber ?? "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(v.ppnAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(v.pphJasaAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(v.pphFreelanceAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
