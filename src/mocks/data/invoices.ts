import type { InvoiceItem, InvoiceStatus, InvoiceHistoryEntry } from "@/types/invoice";

export interface DummyInvoice {
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  ppnPercent: number;
  notes: string | null;
  status: InvoiceStatus;
  preparedBy: string;
  history: InvoiceHistoryEntry[];
}

export const dummyInvoices: DummyInvoice[] = [
  {
    invoiceNumber: "INV/2608/0001",
    customerName: "PT Sumber Makmur",
    date: "2026-08-05",
    dueDate: "2026-09-04",
    items: [{ description: "Jasa konsultasi implementasi ERP - Agustus", qty: 1, unitPrice: 25000000 }],
    ppnPercent: 11,
    notes: "Pembayaran via transfer ke rekening perusahaan.",
    status: "draft",
    preparedBy: "Dina Pratiwi",
    history: [{ status: "draft", by: "Dina Pratiwi", at: "2026-08-05T09:00:00.000Z" }],
  },
  {
    invoiceNumber: "INV/2607/0004",
    customerName: "CV Cipta Karya",
    date: "2026-07-10",
    dueDate: "2026-08-09",
    items: [
      { description: "Instalasi jaringan listrik tahap 2", qty: 1, unitPrice: 18000000 },
      { description: "Material tambahan", qty: 3, unitPrice: 1200000 },
    ],
    ppnPercent: 11,
    notes: null,
    status: "sent",
    preparedBy: "Dina Pratiwi",
    history: [
      { status: "draft", by: "Dina Pratiwi", at: "2026-07-10T09:00:00.000Z" },
      { status: "sent", by: "Dina Pratiwi", at: "2026-07-11T10:00:00.000Z" },
    ],
  },
  {
    invoiceNumber: "INV/2608/0002",
    customerName: "PT Anugrah Jaya",
    date: "2026-08-20",
    dueDate: "2026-09-19",
    items: [{ description: "Pengadaan furnitur kantor - termin 1", qty: 1, unitPrice: 42000000 }],
    ppnPercent: 11,
    notes: null,
    status: "sent",
    preparedBy: "Dina Pratiwi",
    history: [
      { status: "draft", by: "Dina Pratiwi", at: "2026-08-20T09:00:00.000Z" },
      { status: "sent", by: "Dina Pratiwi", at: "2026-08-20T13:30:00.000Z" },
    ],
  },
  {
    invoiceNumber: "INV/2607/0003",
    customerName: "PT Mitra Guna Persada",
    date: "2026-07-01",
    dueDate: "2026-07-31",
    items: [{ description: "Jasa renovasi gudang - pelunasan", qty: 1, unitPrice: 30000000 }],
    ppnPercent: 11,
    notes: null,
    status: "paid",
    preparedBy: "Dina Pratiwi",
    history: [
      { status: "draft", by: "Dina Pratiwi", at: "2026-07-01T09:00:00.000Z" },
      { status: "sent", by: "Dina Pratiwi", at: "2026-07-01T11:00:00.000Z" },
      { status: "paid", by: "Dina Pratiwi", at: "2026-07-25T14:00:00.000Z" },
    ],
  },
];
