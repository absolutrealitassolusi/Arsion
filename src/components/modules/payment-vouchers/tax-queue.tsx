"use client";

import { useState } from "react";
import { CheckCircle2, FileWarning, Landmark, Receipt } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { PaymentVoucherWorklistTable } from "@/components/modules/payment-vouchers/payment-voucher-worklist-table";
import { usePaymentVouchers } from "@/hooks/use-payment-vouchers";
import { formatCurrency } from "@/lib/utils";
import { pvTaxStatus, type PvDirection } from "@/types/payment-voucher";

type TaxTab = "incomplete" | "complete";

const TABS = [
  { key: "incomplete", label: "Belum Lengkap" },
  { key: "complete", label: "Sudah Lengkap" },
];

/**
 * Halaman Tax In/Out: PV yang sudah dibayar DAN kena pajak (PPN/PPh).
 * "Lengkap" = Faktur Pajak ada (kalau kena PPN) & Bukti Potong ada (kalau
 * kena PPh) - lihat pvTaxStatus. Query-nya sama dengan tabel di bawah,
 * jadi gak ada request dobel.
 */
export function TaxQueue({ direction }: { direction: PvDirection }) {
  const [tab, setTab] = useState<TaxTab>("incomplete");
  const { data, isLoading } = usePaymentVouchers({ status: "paid", direction });

  const taxed = (data?.data ?? [])
    .map((v) => ({ v, tax: pvTaxStatus(v, v.withholdingProofCount ?? 0) }))
    .filter(({ tax }) => tax.required);
  const incomplete = taxed.filter(({ tax }) => !tax.complete).length;
  const complete = taxed.length - incomplete;
  const totalPpn = taxed.reduce((s, { v }) => s + v.ppnAmount, 0);
  const totalPph = taxed.reduce((s, { v }) => s + v.pphJasaAmount + v.pphFreelanceAmount, 0);
  const show = (value: string) => (isLoading ? "…" : value);

  const basePath = `/finance/tax/tax-${direction}`;
  const label = direction === "in" ? "PV In" : "PV Out";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Belum Lengkap" value={show(`${incomplete} PV`)} icon={FileWarning} />
        <StatCard label="Sudah Lengkap" value={show(`${complete} PV`)} icon={CheckCircle2} />
        <StatCard label="Total PPN" value={show(formatCurrency(totalPpn))} icon={Receipt} />
        <StatCard label="Total PPh Dipotong" value={show(formatCurrency(totalPph))} icon={Landmark} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Tabs tabs={TABS} active={tab} onChange={(key) => setTab(key as TaxTab)} />
          <PaymentVoucherWorklistTable
            key={tab}
            status="paid"
            direction={direction}
            basePath={basePath}
            taxFilter={tab}
            emptyMessage={
              tab === "incomplete"
                ? `Semua ${label} yang kena pajak sudah lengkap dokumennya.`
                : `Belum ada ${label} yang dokumen pajaknya lengkap.`
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
