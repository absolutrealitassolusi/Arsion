"use client";

import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaymentVouchers } from "@/hooks/use-payment-vouchers";
import { cn, formatCurrency } from "@/lib/utils";

/**
 * Cuma hitung PV yang statusnya "paid" - PV yang masih Draft/Menunggu
 * Approval belum benar-benar jadi arus kas, jadi gak masuk hitungan.
 */
export function CashFlowReport() {
  const { data, isLoading } = usePaymentVouchers({ status: "paid" });
  const vouchers = data?.data ?? [];

  const cashIn = vouchers.filter((v) => v.direction === "in").reduce((sum, v) => sum + v.totalAmount, 0);
  const cashOut = vouchers.filter((v) => v.direction === "out").reduce((sum, v) => sum + v.totalAmount, 0);
  const net = cashIn - cashOut;
  const maxValue = Math.max(cashIn, cashOut, 1);

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
    </div>
  );
}
