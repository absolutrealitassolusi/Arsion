export type PvDirection = "in" | "out";
export type PvStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";
export type PaymentMethod = "transfer" | "cash" | "cheque";

/** Barang kena PPN, Jasa kena PPh 23 (badan usaha), Freelance kena PPh 21 (perorangan), Non Pajak gak kena apa-apa. */
export type ItemCategory = "barang" | "jasa" | "freelance" | "non_pajak";

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  barang: "B - Barang",
  jasa: "J - Jasa",
  freelance: "F - Freelance",
  non_pajak: "N - Non Pajak",
};

export interface PaymentVoucherItem {
  category: ItemCategory;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface PaymentVoucherHistoryEntry {
  status: PvStatus;
  by: string;
  at: string;
  note?: string;
}

export interface PaymentVoucherTotals {
  subtotal: number;
  ppnAmount: number;
  pphJasaAmount: number;
  pphFreelanceAmount: number;
  totalAmount: number;
}

/**
 * Subtotal dihitung dari semua item. PPN dihitung dari semua item KECUALI
 * kategori "non_pajak" (barang, jasa, maupun freelance semuanya bisa kena
 * PPN - tinggal isi 0% di PV yang memang tidak mau kena PPN). PPh 23 dari
 * kategori "jasa" saja, PPh 21 dari kategori "freelance" saja - keduanya
 * jalan independen dari PPN (satu item Jasa bisa kena PPN sekaligus
 * dipotong PPh 23, sesuai praktik faktur jasa profesional pada umumnya).
 */
export function calculatePvTotals(
  items: PaymentVoucherItem[],
  rates: { ppnPercent: number; pphJasaPercent: number; pphFreelancePercent: number }
): PaymentVoucherTotals {
  const amountOf = (item: PaymentVoucherItem) => (item.qty || 0) * (item.unitPrice || 0);
  const subtotal = items.reduce((sum, item) => sum + amountOf(item), 0);

  const baseFor = (category: ItemCategory) =>
    items.filter((i) => i.category === category).reduce((sum, item) => sum + amountOf(item), 0);

  const ppnBase = subtotal - baseFor("non_pajak");
  const ppnAmount = Math.round((ppnBase * (rates.ppnPercent || 0)) / 100);
  const pphJasaAmount = Math.round((baseFor("jasa") * (rates.pphJasaPercent || 0)) / 100);
  const pphFreelanceAmount = Math.round((baseFor("freelance") * (rates.pphFreelancePercent || 0)) / 100);

  const totalAmount = subtotal + ppnAmount - pphJasaAmount - pphFreelanceAmount;

  return { subtotal, ppnAmount, pphJasaAmount, pphFreelanceAmount, totalAmount };
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  direction: PvDirection;
  date: string;

  /** Rekening perusahaan sendiri yang dipakai buat bayar/nerima. */
  senderBank: string;

  partyName: string;
  description: string;

  items: PaymentVoucherItem[];
  ppnPercent: number;
  pphJasaPercent: number;
  pphFreelancePercent: number;
  subtotal: number;
  ppnAmount: number;
  pphJasaAmount: number;
  pphFreelanceAmount: number;
  totalAmount: number;

  paymentMethod: PaymentMethod;

  /** Rekening lawan transaksi (Vendor/Customer), dipecah 3 supaya lebih terstruktur. */
  receiverBankName: string;
  receiverAccountName: string;
  receiverAccountNumber: string;

  /** Referensi dokumen sumber - semua opsional. */
  projectNumber: string | null;
  poNumber: string | null;
  invoiceNumber: string | null;
  taxInvoiceNumber: string | null;

  attachmentName: string | null;
  /** Data URL tiap halaman Lampiran (1 elemen kalau JPG/PNG, banyak kalau PDF multi-halaman) - dipakai buat preview & ikut ke print. */
  attachmentUrls: string[] | null;
  status: PvStatus;

  /** Blok tanda tangan - approvedBy/paidBy baru terisi setelah workflow-nya jalan. */
  preparedBy: string;
  approvedBy: string | null;
  paidBy: string | null;

  /**
   * Bukti dokumen - cuma bisa diisi setelah status "paid", lihat tab Payment/Tax.
   * `*Urls` isinya data URL tiap halaman (buat preview & print), beda dari
   * `*FileName` yang cuma nama file buat ditampilkan sebagai label.
   */
  paymentProofFileName: string | null;
  paymentProofUrls: string[] | null;
  taxProofFileName: string | null;
  taxProofUrls: string[] | null;

  /**
   * Salinan (snapshot) tanda tangan user di momen status berubah - null kalau
   * belum pernah berubah ke status itu, ATAU baris lama dari sebelum fitur
   * ini ada (fallback ke lookup live-by-name di payment-voucher-print.tsx).
   */
  preparedSignatureSnapshot: string | null;
  approvedSignatureSnapshot: string | null;
  paidSignatureSnapshot: string | null;

  /** Riwayat perpindahan status - dipakai buat tab History. */
  history: PaymentVoucherHistoryEntry[];

  createdAt: string;
  updatedAt: string;
}

export type PaymentVoucherPayload = Pick<
  PaymentVoucher,
  | "direction"
  | "date"
  | "senderBank"
  | "partyName"
  | "description"
  | "items"
  | "ppnPercent"
  | "pphJasaPercent"
  | "pphFreelancePercent"
  | "paymentMethod"
  | "receiverBankName"
  | "receiverAccountName"
  | "receiverAccountNumber"
  | "projectNumber"
  | "poNumber"
  | "invoiceNumber"
  | "taxInvoiceNumber"
  | "attachmentName"
  | "attachmentUrls"
>;

export interface PaymentVoucherListResponse {
  data: PaymentVoucher[];
  total: number;
}

export interface PaymentVoucherDetailResponse {
  data: PaymentVoucher;
}
