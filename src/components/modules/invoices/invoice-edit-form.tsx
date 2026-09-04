"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useInvoice } from "@/hooks/use-invoices";
import { InvoiceForm } from "@/components/modules/invoices/invoice-form";

interface InvoiceEditFormProps {
  invoiceId: string;
}

/** Sama pola-nya kaya PaymentVoucherEditForm - ambil data dulu baru render InvoiceForm dalam mode edit. */
export function InvoiceEditForm({ invoiceId }: InvoiceEditFormProps) {
  const { data, isLoading } = useInvoice(invoiceId);
  const invoice = data?.data;

  if (isLoading || !invoice) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">Memuat data Invoice...</CardContent>
      </Card>
    );
  }

  if (invoice.status !== "draft") {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Cuma Invoice berstatus Draft yang bisa diedit.
        </CardContent>
      </Card>
    );
  }

  return <InvoiceForm editInvoice={invoice} />;
}
