"use client";

import { useMemo, useState } from "react";
import { FileText, Wallet, AlertTriangle, Download, Inbox } from "lucide-react";
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
import { useInvoices } from "@/hooks/use-invoices";
import { buildReportWorkbook, downloadWorkbook } from "@/lib/export-excel";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/invoice";

const statusMap: Record<InvoiceStatus, { label: string; variant: "success" | "secondary" | "default" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Terkirim", variant: "default" },
  paid: { label: "Lunas", variant: "success" },
};

const statusOrder: InvoiceStatus[] = ["draft", "sent", "paid"];

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function periodLabel(month: string) {
  if (!month) return "Semua Periode";
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function InvoiceReport() {
  const [month, setMonth] = useState(currentMonthValue());
  const [status, setStatus] = useState("");
  const { data, isLoading } = useInvoices({});

  const invoices = useMemo(() => {
    return (data?.data ?? []).filter((inv) => {
      if (month && !inv.date.startsWith(month)) return false;
      if (status && inv.status !== status) return false;
      return true;
    });
  }, [data, month, status]);

  const totalValue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const overdueCount = invoices.filter((inv) => inv.isOverdue).length;

  const byStatus = statusOrder.map((s) => {
    const list = invoices.filter((inv) => inv.status === s);
    return { status: s, count: list.length, total: list.reduce((sum, inv) => sum + inv.totalAmount, 0) };
  });

  const handleDownload = () => {
    const workbook = buildReportWorkbook({
      title: "Invoice Report",
      periodLabel: periodLabel(month),
      summarySheet: {
        headers: ["Status", "Jumlah Invoice", "Total Nilai"],
        rows: byStatus.map((row) => [statusMap[row.status].label, row.count, row.total]),
      },
      detailSheet: {
        headers: ["No. Invoice", "Tanggal", "Customer", "Jatuh Tempo", "Total", "Status"],
        rows: invoices.map((inv) => [
          inv.invoiceNumber,
          formatDate(inv.date),
          inv.customerName,
          formatDate(inv.dueDate),
          inv.totalAmount,
          statusMap[inv.status].label + (inv.isOverdue ? " (Jatuh Tempo)" : ""),
        ]),
      },
    });
    void downloadWorkbook(workbook, `Invoice-Report-${month || "semua-periode"}.xlsx`);
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
        <Button variant="outline" className="ml-auto" onClick={handleDownload}>
          <Download className="h-4 w-4" /> Download Excel
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Invoice" value={String(invoices.length)} icon={FileText} />
        <StatCard label="Total Nilai" value={formatCurrency(totalValue)} icon={Wallet} />
        <StatCard label="Jatuh Tempo" value={String(overdueCount)} icon={AlertTriangle} />
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
                <TableHead>Jumlah Invoice</TableHead>
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
                <TableHead>No. Invoice</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8" />
                      <p className="text-sm">Tidak ada Invoice pada periode/status ini.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((inv) => {
                const st = statusMap[inv.status];
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.date)}</TableCell>
                    <TableCell>{inv.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={st.variant}>{st.label}</Badge>
                        {inv.isOverdue && <Badge variant="destructive">Jatuh Tempo</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
