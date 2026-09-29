"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs } from "@/components/ui/tabs";
import { PaymentVoucherArchiveTable } from "@/components/modules/payment-vouchers/payment-voucher-archive-table";
import { InvoiceTable } from "@/components/modules/invoices/invoice-table";

const tabs = [
  { key: "pv", label: "Payment Voucher" },
  { key: "invoice", label: "Invoice" },
];

export default function FinanceArchivePage() {
  const [activeTab, setActiveTab] = useState("pv");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Archive"
        description="Riwayat seluruh Payment Voucher dan Invoice."
      />
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      {activeTab === "pv" && <PaymentVoucherArchiveTable />}
      {activeTab === "invoice" && <InvoiceTable />}
    </div>
  );
}
