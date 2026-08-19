"use client";

import { Receipt, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
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
import { usePaymentVouchers } from "@/hooks/use-payment-vouchers";
import { formatCurrency } from "@/lib/utils";
import type { PvStatus } from "@/types/payment-voucher";

const statusMap: Record<PvStatus, { label: string; variant: "secondary" | "default" | "success" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Menunggu Approval", variant: "default" },
  approved: { label: "Disetujui", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  paid: { label: "Dibayar", variant: "success" },
};

const statusOrder: PvStatus[] = ["draft", "submitted", "approved", "rejected", "paid"];

export function VoucherReport() {
  const { data, isLoading } = usePaymentVouchers({});
  const vouchers = data?.data ?? [];

  const totalIn = vouchers.filter((v) => v.direction === "in").length;
  const totalOut = vouchers.filter((v) => v.direction === "out").length;
  const totalValue = vouchers.reduce((sum, v) => sum + v.totalAmount, 0);

  const byStatus = statusOrder.map((status) => {
    const list = vouchers.filter((v) => v.status === status);
    return {
      status,
      count: list.length,
      total: list.reduce((sum, v) => sum + v.totalAmount, 0),
    };
  });

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
    </div>
  );
}
