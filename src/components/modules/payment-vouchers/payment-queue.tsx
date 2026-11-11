"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Wallet } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { PaymentVoucherWorklistTable } from "@/components/modules/payment-vouchers/payment-voucher-worklist-table";
import { usePaymentVouchers } from "@/hooks/use-payment-vouchers";
import { formatCurrency } from "@/lib/utils";

type PaymentTab = "waiting" | "paid";

const TABS = [
  { key: "waiting", label: "Menunggu Pembayaran" },
  { key: "paid", label: "Sudah Dibayar" },
];

function isThisMonth(date: string, now: Date): boolean {
  const d = new Date(date);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/**
 * Halaman Payment: ringkasan + 2 tab. Tab "Sudah Dibayar" supaya staf
 * pembayaran bisa buka lagi PV yang sudah dibayar (mis. ganti bukti
 * transfer) tanpa harus cari lewat Archive. Query-nya sama persis dengan
 * yang dipakai tabel di bawah, jadi gak ada request dobel.
 */
export function PaymentQueue() {
  const [tab, setTab] = useState<PaymentTab>("waiting");
  const waiting = usePaymentVouchers({ status: "approved" });
  const paid = usePaymentVouchers({ status: "paid" });

  const now = new Date();
  const waitingList = waiting.data?.data ?? [];
  // PV lama tanpa paidAt diperkirakan dari updatedAt - sama dengan dashboard.
  const paidThisMonth = (paid.data?.data ?? []).filter((v) => isThisMonth(v.paidAt ?? v.updatedAt, now));
  const loadingText = "…";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Menunggu Pembayaran"
          value={waiting.isLoading ? loadingText : `${waitingList.length} PV`}
          hint={waiting.isLoading ? undefined : formatCurrency(waitingList.reduce((s, v) => s + v.totalAmount, 0))}
          icon={Clock}
        />
        <StatCard
          label="Dibayar Bulan Ini"
          value={paid.isLoading ? loadingText : `${paidThisMonth.length} PV`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Total Dibayarkan Bulan Ini"
          value={paid.isLoading ? loadingText : formatCurrency(paidThisMonth.reduce((s, v) => s + v.totalAmount, 0))}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Tabs tabs={TABS} active={tab} onChange={(key) => setTab(key as PaymentTab)} />
          {tab === "waiting" ? (
            <PaymentVoucherWorklistTable
              status="approved"
              basePath="/finance/payment"
              emptyMessage="Tidak ada Payment Voucher yang siap dibayar."
              showPaymentMethod
            />
          ) : (
            <PaymentVoucherWorklistTable
              status="paid"
              basePath="/finance/payment"
              emptyMessage="Belum ada Payment Voucher yang dibayar."
              showPaymentMethod
              showPaidAt
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
