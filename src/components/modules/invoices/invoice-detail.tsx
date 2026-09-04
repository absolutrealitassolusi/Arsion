"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Printer, Send, Wallet, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import type { InvoiceStatus } from "@/types/invoice";
import { useInvoice, useSendInvoice, useMarkInvoicePaid } from "@/hooks/use-invoices";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { InvoicePrint } from "@/components/modules/invoices/invoice-print";

const statusMap: Record<InvoiceStatus, { label: string; variant: "secondary" | "default" | "success" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Terkirim", variant: "default" },
  paid: { label: "Lunas", variant: "success" },
};

const historyStatusLabel: Record<InvoiceStatus, string> = {
  draft: "Dibuat sebagai Draft",
  sent: "Ditandai Terkirim",
  paid: "Ditandai Lunas",
};

type PendingAction = "send" | "pay" | null;

interface InvoiceDetailProps {
  invoiceId: string;
  /** Kalau diisi, abis Tandai Terkirim/Lunas sukses langsung balik ke halaman ini - sama pola-nya kaya PaymentVoucherDetailTabs. */
  backToListPath?: string;
}

export function InvoiceDetail({ invoiceId, backToListPath }: InvoiceDetailProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const { data, isLoading } = useInvoice(invoiceId);
  const sendInvoice = useSendInvoice(invoiceId);
  const markPaid = useMarkInvoicePaid(invoiceId);

  const invoice = data?.data;

  if (isLoading || !invoice) {
    return <div className="py-14 text-center text-sm text-muted-foreground">Memuat invoice...</div>;
  }

  const status = statusMap[invoice.status];

  const confirmPendingAction = () => {
    if (pendingAction === "send") {
      sendInvoice.mutate(undefined, {
        onSuccess: () => {
          setPendingAction(null);
          if (backToListPath) router.push(backToListPath);
        },
      });
    } else if (pendingAction === "pay") {
      markPaid.mutate(undefined, {
        onSuccess: () => {
          setPendingAction(null);
          if (backToListPath) router.push(backToListPath);
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <InvoicePrint invoice={invoice} />

      <div className="flex justify-end print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Preview & Cetak
        </Button>
      </div>

      <Card className="print:hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{invoice.invoiceNumber}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            {invoice.isOverdue && <Badge variant="destructive">Jatuh Tempo</Badge>}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Customer</dt>
              <dd className="text-sm font-medium">{invoice.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Dibuat oleh</dt>
              <dd className="text-sm font-medium">{invoice.preparedBy}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tanggal</dt>
              <dd className="text-sm font-medium">{formatDate(invoice.date)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Jatuh Tempo</dt>
              <dd className="text-sm font-medium">{formatDate(invoice.dueDate)}</dd>
            </div>
          </dl>

          <div className="overflow-hidden rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.qty * item.unitPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="ml-auto w-full space-y-2 rounded-[10px] bg-secondary/40 p-4 text-sm sm:max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">PPN ({invoice.ppnPercent}%)</span>
              <span>{formatCurrency(invoice.ppnAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div>
              <dt className="text-xs text-muted-foreground">Catatan</dt>
              <dd className="mt-1 text-sm">{invoice.notes}</dd>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {invoice.status === "draft" && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/finance/invoice/${invoice.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Edit Invoice
                  </Link>
                </Button>
                <Button onClick={() => setPendingAction("send")}>
                  <Send className="h-4 w-4" />
                  Tandai Terkirim
                </Button>
              </>
            )}
            {invoice.status === "sent" && (
              <Button onClick={() => setPendingAction("pay")}>
                <Wallet className="h-4 w-4" />
                Tandai Lunas
              </Button>
            )}
            {invoice.status === "paid" && (
              <p className="text-sm text-muted-foreground">Invoice ini sudah lunas.</p>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium">Riwayat</p>
            <ul className="space-y-2">
              {invoice.history.map((entry, index) => (
                <li key={index} className="flex items-center justify-between text-sm">
                  <span>
                    {historyStatusLabel[entry.status]} oleh <span className="font-medium">{entry.by}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction === "send" ? "Tandai invoice ini terkirim?" : "Tandai invoice ini lunas?"}
        description={
          pendingAction === "send"
            ? "Invoice akan berstatus Terkirim - pastikan sudah dikirim ke customer."
            : "Invoice akan berstatus Lunas - pastikan pembayaran sudah diterima."
        }
        confirmLabel={pendingAction === "send" ? "Tandai Terkirim" : "Tandai Lunas"}
        onConfirm={confirmPendingAction}
        isLoading={sendInvoice.isPending || markPaid.isPending}
      />
    </div>
  );
}
