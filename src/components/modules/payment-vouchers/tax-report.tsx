"use client";

import { useMemo, useState } from "react";
import { Percent, TrendingUp, TrendingDown, Download, Printer } from "lucide-react";
import { ReportPrintView } from "@/components/shared/report-print-view";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PvStatus } from "@/types/payment-voucher";

const statusLabels: Record<PvStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  paid: "Dibayar",
};

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function periodLabel(month: string) {
  if (!month) return "Semua Periode";
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function TaxReport() {
  const [month, setMonth] = useState(currentMonthValue());
  const [status, setStatus] = useState("");
  const { data, isLoading } = usePaymentVouchers({});

  const vouchers = useMemo(() => {
    return (data?.data ?? []).filter((v) => {
      if (month && !v.date.startsWith(month)) return false;
      if (status && v.status !== status) return false;
      return true;
    });
  }, [data, month, status]);

  const totalPpn = vouchers.reduce((sum, v) => sum + v.ppnAmount, 0);
  const totalPphJasa = vouchers.reduce((sum, v) => sum + v.pphJasaAmount, 0);
  const totalPphFreelance = vouchers.reduce((sum, v) => sum + v.pphFreelanceAmount, 0);

  const taxedVouchers = vouchers.filter(
    (v) => v.ppnAmount > 0 || v.pphJasaAmount > 0 || v.pphFreelanceAmount > 0
  );

  const reportData = {
    title: "Tax Report",
    periodLabel: periodLabel(month),
    summarySheet: {
      headers: ["Ringkasan", "Total"],
      rows: [
        ["Total PPN Dipungut", totalPpn],
        ["Total PPh 23 Dipotong", totalPphJasa],
        ["Total PPh 21 Dipotong", totalPphFreelance],
      ],
    },
    detailSheet: {
      headers: ["No. PV", "Tanggal", "Vendor/Customer", "Faktur Pajak", "PPN", "PPh 23", "PPh 21"],
      rows: taxedVouchers.map((v) => [
        v.voucherNumber,
        formatDate(v.date),
        v.partyName,
        v.taxInvoiceNumber ?? "-",
        v.ppnAmount,
        v.pphJasaAmount,
        v.pphFreelanceAmount,
      ]),
    },
  };

  const handleDownloadExcel = () => {
    const workbook = buildReportWorkbook(reportData);
    void downloadWorkbook(workbook, `Tax-Report-${month || "semua-periode"}.xlsx`);
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
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {(Object.keys(statusLabels) as PvStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadExcel}>
            <Download className="h-4 w-4" /> Download Excel
          </Button>
        </div>
      </div>

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
                    Tidak ada Payment Voucher dengan pajak pada periode/status ini.
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
    </div>
  );
}
