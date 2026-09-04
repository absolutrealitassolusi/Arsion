import type { Invoice as ApiInvoice, InvoiceHistoryEntry, InvoiceItem, InvoiceStatus } from "@/types/invoice";

interface DbInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: Date;
  dueDate: Date;
  items: unknown;
  ppnPercent: number;
  subtotal: number;
  ppnAmount: number;
  totalAmount: number;
  notes: string | null;
  status: InvoiceStatus;
  preparedBy: string;
  history: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeInvoice(invoice: DbInvoice): ApiInvoice {
  const dateStr = invoice.date.toISOString().slice(0, 10);
  const dueDateStr = invoice.dueDate.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    date: dateStr,
    dueDate: dueDateStr,
    items: invoice.items as InvoiceItem[],
    ppnPercent: invoice.ppnPercent,
    subtotal: invoice.subtotal,
    ppnAmount: invoice.ppnAmount,
    totalAmount: invoice.totalAmount,
    notes: invoice.notes,
    status: invoice.status,
    isOverdue: invoice.status === "sent" && dueDateStr < today,
    preparedBy: invoice.preparedBy,
    history: invoice.history as InvoiceHistoryEntry[],
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}
