export type InvoiceStatus = "draft" | "sent" | "paid";

export interface InvoiceItem {
  itemCode?: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface InvoiceHistoryEntry {
  status: InvoiceStatus;
  by: string;
  at: string;
  note?: string;
}

export interface InvoiceTotals {
  subtotal: number;
  ppnAmount: number;
  totalAmount: number;
}

export function calculateInvoiceTotals(items: InvoiceItem[], ppnPercent: number): InvoiceTotals {
  const subtotal = items.reduce((sum, item) => sum + (item.qty || 0) * (item.unitPrice || 0), 0);
  const ppnAmount = Math.round((subtotal * (ppnPercent || 0)) / 100);
  return { subtotal, ppnAmount, totalAmount: subtotal + ppnAmount };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;

  items: InvoiceItem[];
  ppnPercent: number;
  subtotal: number;
  ppnAmount: number;
  totalAmount: number;

  /** Nomor PO/Contract dari customer - dipakai buat referensi di cetakan. */
  poContractNo: string | null;
  /** Alamat pengiriman - "Sold To" di cetakan pakai customerName, "Delivered To" pakai field ini. */
  deliveredTo: string | null;
  /** Rekening PERUSAHAAN KITA (bukan rekening customer) buat blok "Paid To" di cetakan. */
  paidToBankName: string | null;
  paidToAccountNumber: string | null;
  paidToAccountName: string | null;

  notes: string | null;
  status: InvoiceStatus;
  /** Belum lunas & sudah lewat tanggal jatuh tempo - dihitung, bukan status tersimpan (lihat src/lib/serialize-invoice.ts). */
  isOverdue: boolean;

  preparedBy: string;
  history: InvoiceHistoryEntry[];

  createdAt: string;
  updatedAt: string;
}

export type InvoicePayload = Pick<
  Invoice,
  | "customerName"
  | "date"
  | "dueDate"
  | "items"
  | "ppnPercent"
  | "poContractNo"
  | "deliveredTo"
  | "paidToBankName"
  | "paidToAccountNumber"
  | "paidToAccountName"
  | "notes"
>;

export interface InvoiceListResponse {
  data: Invoice[];
  total: number;
}

export interface InvoiceDetailResponse {
  data: Invoice;
}
