"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Scale, Download, Printer, Inbox } from "lucide-react";
import { ReportPrintView } from "@/components/shared/report-print-view";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { usePaymentVouchers } from "@/hooks/use-payment-vouchers";
import { buildReportWorkbook, downloadWorkbook } from "@/lib/export-excel";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function periodLabel(month: string) {
  if (!month) return "Semua Periode";
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/**
 * Cuma hitung PV yang statusnya "paid" - PV yang masih Draft/Menunggu
 * Approval belum benar-benar jadi arus kas, jadi gak masuk hitungan.
 */
export function CashFlowReport() {
  const [month, setMonth] = useState(currentMonthValue());
  const { data, isLoading } = usePaymentVouchers({ status: "paid" });

  const vouchers = useMemo(() => {
    return (data?.data ?? []).filter((v) => !month || v.date.startsWith(month));
  }, [data, month]);

  const cashIn = vouchers.filter((v) => v.direction === "in").reduce((sum, v) => sum + v.totalAmount, 0);
  const cashOut = vouchers.filter((v) => v.direction === "out").reduce((sum, v) => sum + v.totalAmount, 0);
  const net = cashIn - cashOut;
  const maxValue = Math.max(cashIn, cashOut, 1);

  const reportData = {
    title: "Cash Flow Report",
    periodLabel: periodLabel(month),
    summarySheet: {
      headers: ["Ringkasan", "Total"],
      rows: [
        ["Total Uang Masuk", cashIn],
        ["Total Uang Keluar", cashOut],
        ["Arus Kas Bersih", net],
      ],
    },
    detailSheet: {
      headers: ["No. PV", "Tanggal", "Arah", "Vendor/Customer", "Total"],
      rows: vouchers.map((v) => [
        v.voucherNumber,
        formatDate(v.date),
        v.direction === "in" ? "In" : "Out",
        v.partyName,
        v.totalAmount,
      ]),
    },
  };

  const handleDownloadExcel = () => {
    const workbook = buildReportWorkbook(reportData);
    void downloadWorkbook(workbook, `Cash-Flow-Report-${month || "semua-periode"}.xlsx`);
  };

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
      <ReportPrintView {...reportData} />

      <div className="space-y-6 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadExcel}>
            <Download className="h-4 w-4" /> Download Excel
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Hanya menghitung Payment Voucher berstatus <strong>Dibayar</strong> - yang masih Draft/Menunggu
        Approval belum dianggap arus kas beneran.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Uang Masuk" value={formatCurrency(cashIn)} icon={ArrowDownLeft} />
        <StatCard label="Total Uang Keluar" value={formatCurrency(cashOut)} icon={ArrowUpRight} />
        <StatCard label="Arus Kas Bersih" value={formatCurrency(net)} icon={Scale} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Uang Masuk vs Keluar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uang Masuk</span>
              <span className="font-medium">{formatCurrency(cashIn)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${(cashIn / maxValue) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uang Keluar</span>
              <span className="font-medium">{formatCurrency(cashOut)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(cashOut / maxValue) * 100}%` }}
              />
            </div>
          </div>

          <div
            className={cn(
              "rounded-[10px] border border-border p-4 text-sm font-semibold",
              net >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {net >= 0 ? "Surplus" : "Defisit"}: {formatCurrency(Math.abs(net))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rincian Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. PV</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Arah</TableHead>
                <TableHead>Vendor/Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8" />
                      <p className="text-sm">Tidak ada PV yang dibayar pada periode ini.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {vouchers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.voucherNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(v.date)}</TableCell>
                  <TableCell>{v.direction === "in" ? "In" : "Out"}</TableCell>
                  <TableCell>{v.partyName}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(v.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
