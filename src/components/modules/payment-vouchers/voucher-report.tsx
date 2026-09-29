"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Receipt, ArrowDownLeft, ArrowUpRight, Wallet, Download, Printer, Paperclip, Inbox } from "lucide-react";
import { ReportPrintView } from "@/components/shared/report-print-view";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const statusMap: Record<PvStatus, { label: string; variant: "secondary" | "default" | "success" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Menunggu Approval", variant: "default" },
  approved: { label: "Disetujui", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  paid: { label: "Dibayar", variant: "success" },
};

const statusOrder: PvStatus[] = ["draft", "submitted", "approved", "rejected", "paid"];

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function periodLabel(month: string) {
  if (!month) return "Semua Periode";
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function VoucherReport() {
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

  const totalIn = vouchers.filter((v) => v.direction === "in").length;
  const totalOut = vouchers.filter((v) => v.direction === "out").length;
  const totalValue = vouchers.reduce((sum, v) => sum + v.totalAmount, 0);

  const byStatus = statusOrder.map((s) => {
    const list = vouchers.filter((v) => v.status === s);
    return { status: s, count: list.length, total: list.reduce((sum, v) => sum + v.totalAmount, 0) };
  });

  const reportData = {
    title: "Voucher Report",
    periodLabel: periodLabel(month),
    summarySheet: {
      headers: ["Status", "Jumlah PV", "Total Nilai"],
      rows: byStatus.map((row) => [statusMap[row.status].label, row.count, row.total]),
    },
    detailSheet: {
      headers: ["No. PV", "Tanggal", "Arah", "Vendor/Customer", "Total", "Status"],
      rows: vouchers.map((v) => [
        v.voucherNumber,
        formatDate(v.date),
        v.direction === "in" ? "In" : "Out",
        v.partyName,
        v.totalAmount,
        statusMap[v.status].label,
      ]),
    },
  };

  const handleDownloadExcel = () => {
    const workbook = buildReportWorkbook(reportData);
    void downloadWorkbook(workbook, `Voucher-Report-${month || "semua-periode"}.xlsx`);
  };

  const handleDownloadAttachments = async () => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (status) params.set("status", status);

    const res = await fetch(`/api/payment-vouchers/attachments-zip?${params.toString()}`);
    if (res.status === 404) {
      const body = (await res.json()) as { message?: string };
      toast.error(body.message ?? "Tidak ada lampiran pada periode/status ini.");
      return;
    }
    if (!res.ok) {
      toast.error("Gagal download lampiran.");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Lampiran-PV-${month || "semua-periode"}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            {statusOrder.map((s) => (
              <SelectItem key={s} value={s}>
                {statusMap[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" onClick={handleDownloadExcel}>
            <Download className="h-4 w-4" /> Download Excel
          </Button>
          <Button variant="outline" onClick={() => void handleDownloadAttachments()}>
            <Paperclip className="h-4 w-4" /> Download Lampiran (ZIP)
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Payment Voucher" value={String(vouchers.length)} icon={Receipt} />
        <StatCard label="Total PV In" value={String(totalIn)} icon={ArrowDownLeft} />
        <StatCard label="Total PV Out" value={String(totalOut)} icon={ArrowUpRight} />
        <StatCard label="Total Nilai" value={formatCurrency(totalValue)} icon={Wallet} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rincian per Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Jumlah PV</TableHead>
                <TableHead className="text-right">Total Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byStatus.map((row) => {
                const st = statusMap[row.status];
                return (
                  <TableRow key={row.status}>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.total)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8" />
                      <p className="text-sm">Tidak ada PV pada periode/status ini.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {vouchers.map((v) => {
                const st = statusMap[v.status];
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.voucherNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(v.date)}</TableCell>
                    <TableCell>{v.direction === "in" ? "In" : "Out"}</TableCell>
                    <TableCell>{v.partyName}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(v.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
