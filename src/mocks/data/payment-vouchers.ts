import { calculatePvTotals } from "@/types/payment-voucher";
import type { PaymentVoucher, PaymentVoucherItem } from "@/types/payment-voucher";

function buildVoucher(
  input: Omit<
    PaymentVoucher,
    "subtotal" | "ppnAmount" | "pphJasaAmount" | "pphFreelanceAmount" | "totalAmount"
  >
): PaymentVoucher {
  const totals = calculatePvTotals(input.items, {
    ppnPercent: input.ppnPercent,
    pphJasaPercent: input.pphJasaPercent,
    pphFreelancePercent: input.pphFreelancePercent,
  });
  return { ...input, ...totals };
}

const invoiceItems: PaymentVoucherItem[] = [
  { category: "barang", description: "Laptop Business Pro 14\" x3", qty: 3, unitPrice: 13_500_000 },
];

const jasaItems: PaymentVoucherItem[] = [
  { category: "jasa", description: "Jasa konsultasi pajak bulan Juli", qty: 1, unitPrice: 12_500_000 },
];

const freelanceItems: PaymentVoucherItem[] = [
  { category: "freelance", description: "Desain ulang materi marketing", qty: 1, unitPrice: 5_000_000 },
];

const mixedItems: PaymentVoucherItem[] = [
  { category: "barang", description: "ATK & perlengkapan kantor", qty: 1, unitPrice: 2_000_000 },
  { category: "non_pajak", description: "Reimburse transport tim", qty: 1, unitPrice: 500_000 },
];

/**
 * Contoh "bukti transfer" dummy (SVG data URL) - cuma buat mendemonstrasikan
 * state "sudah ada bukti" di UI/print. Upload sungguhan bakal jadi data URL
 * dari file JPG/PNG/PDF asli, bukan SVG kaya gini.
 */
const sampleReceiptDataUrl =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">` +
      `<rect width="300" height="200" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />` +
      `<text x="20" y="30" font-family="monospace" font-size="12" fill="#1e293b">BUKTI TRANSFER</text>` +
      `<line x1="20" y1="45" x2="280" y2="45" stroke="#cbd5e1" />` +
      `<text x="20" y="70" font-family="monospace" font-size="10" fill="#475569">Bank BNI - Berhasil</text>` +
      `<text x="20" y="90" font-family="monospace" font-size="10" fill="#475569">Ref: 20260721090000</text>` +
      `<text x="20" y="110" font-family="monospace" font-size="10" fill="#475569">Nominal: Rp 4.750.000</text>` +
      `<text x="20" y="130" font-family="monospace" font-size="10" fill="#475569">Ke: Arsion Enterprise</text>` +
      `</svg>`
  );

export const dummyPaymentVouchers: PaymentVoucher[] = [
  buildVoucher({
    id: "PV-0001",
    voucherNumber: "2607450002",
    direction: "out",
    date: "2026-07-25",
    senderBank: "BCA - Rekening Operasional",
    partyName: "PT Sumber Makmur",
    description: "Pembayaran invoice #INV-2231",
    items: invoiceItems,
    ppnPercent: 11,
    pphJasaPercent: 0,
    pphFreelancePercent: 0,
    paymentMethod: "transfer",
    receiverBankName: "BCA",
    receiverAccountName: "PT Sumber Makmur",
    receiverAccountNumber: "1234567890",
    projectNumber: "PRJ-2026-001",
    poNumber: "PO-2026-014",
    invoiceNumber: "INV-2231",
    // Belum "paid" - Faktur Pajak seharusnya belum keisi (baru bisa setelah dibayar).
    taxInvoiceNumber: null,
    attachmentName: "invoice-2231.pdf",
    attachmentUrls: null,
    status: "approved",
    preparedBy: "Dina Pratiwi",
    approvedBy: "Budi Santoso",
    paidBy: null,
    paymentProofFileName: null,
    paymentProofUrls: null,
    taxProofFileName: null,
    taxProofUrls: null,
    preparedSignatureSnapshot: null,
    approvedSignatureSnapshot: null,
    paidSignatureSnapshot: null,
    history: [
      { status: "draft", by: "Dina Pratiwi", at: "2026-07-25T09:00:00.000Z" },
      { status: "submitted", by: "Dina Pratiwi", at: "2026-07-25T14:00:00.000Z" },
      { status: "approved", by: "Budi Santoso", at: "2026-07-26T10:00:00.000Z" },
    ],
    createdAt: "2026-07-25T09:00:00.000Z",
    updatedAt: "2026-07-26T10:00:00.000Z",
  }),
  buildVoucher({
    id: "PV-0002",
    voucherNumber: "2607450003",
    direction: "out",
    date: "2026-07-27",
    senderBank: "BCA - Rekening Operasional",
    partyName: "CV Cipta Karya",
    description: "Jasa konsultasi bulan Juli",
    items: jasaItems,
    ppnPercent: 0,
    pphJasaPercent: 2,
    pphFreelancePercent: 0,
    paymentMethod: "transfer",
    receiverBankName: "Mandiri",
    receiverAccountName: "CV Cipta Karya",
    receiverAccountNumber: "2345678901",
    projectNumber: null,
    poNumber: null,
    invoiceNumber: null,
    taxInvoiceNumber: null,
    attachmentName: null,
    attachmentUrls: null,
    status: "submitted",
    preparedBy: "Dina Pratiwi",
    approvedBy: null,
    paidBy: null,
    paymentProofFileName: null,
    paymentProofUrls: null,
    taxProofFileName: null,
    taxProofUrls: null,
    preparedSignatureSnapshot: null,
    approvedSignatureSnapshot: null,
    paidSignatureSnapshot: null,
    history: [
      { status: "draft", by: "Dina Pratiwi", at: "2026-07-27T13:00:00.000Z" },
      { status: "submitted", by: "Dina Pratiwi", at: "2026-07-27T13:00:00.000Z" },
    ],
    createdAt: "2026-07-27T13:00:00.000Z",
    updatedAt: "2026-07-27T13:00:00.000Z",
  }),
  buildVoucher({
    id: "PV-0003",
    voucherNumber: "2607450001",
    direction: "in",
    date: "2026-07-20",
    senderBank: "Mandiri - Rekening Payroll",
    partyName: "PT Maju Bersama",
    description: "Pelunasan invoice #INV-1187",
    items: freelanceItems,
    ppnPercent: 0,
    pphJasaPercent: 0,
    pphFreelancePercent: 5,
    paymentMethod: "transfer",
    receiverBankName: "BNI",
    receiverAccountName: "Arsion Enterprise",
    receiverAccountNumber: "9988776655",
    projectNumber: null,
    poNumber: null,
    invoiceNumber: "INV-1187",
    taxInvoiceNumber: null,
    attachmentName: "bukti-transfer-1187.jpg",
    attachmentUrls: [sampleReceiptDataUrl],
    status: "paid",
    preparedBy: "Dina Pratiwi",
    approvedBy: "Budi Santoso",
    paidBy: "Sari Wulandari",
    paymentProofFileName: "bukti-transfer-pv0003.jpg",
    paymentProofUrls: [sampleReceiptDataUrl],
    taxProofFileName: null,
    taxProofUrls: null,
    preparedSignatureSnapshot: null,
    approvedSignatureSnapshot: null,
    paidSignatureSnapshot: null,
    history: [
      { status: "draft", by: "Dina Pratiwi", at: "2026-07-20T08:30:00.000Z" },
      { status: "submitted", by: "Dina Pratiwi", at: "2026-07-20T09:00:00.000Z" },
      { status: "approved", by: "Budi Santoso", at: "2026-07-20T15:00:00.000Z" },
      { status: "paid", by: "Sari Wulandari", at: "2026-07-21T09:00:00.000Z" },
    ],
    createdAt: "2026-07-20T08:30:00.000Z",
    updatedAt: "2026-07-21T09:00:00.000Z",
  }),
  buildVoucher({
    id: "PV-0004",
    voucherNumber: "2607450004",
    direction: "in",
    date: "2026-07-28",
    senderBank: "BCA - Rekening Operasional",
    partyName: "CV Karya Sejahtera",
    description: "Uang muka proyek Agustus",
    items: mixedItems,
    ppnPercent: 11,
    pphJasaPercent: 0,
    pphFreelancePercent: 0,
    paymentMethod: "cash",
    receiverBankName: "-",
    receiverAccountName: "-",
    receiverAccountNumber: "-",
    projectNumber: "PRJ-2026-008",
    poNumber: null,
    invoiceNumber: null,
    taxInvoiceNumber: null,
    attachmentName: null,
    attachmentUrls: null,
    status: "draft",
    preparedBy: "Dina Pratiwi",
    approvedBy: null,
    paidBy: null,
    paymentProofFileName: null,
    paymentProofUrls: null,
    taxProofFileName: null,
    taxProofUrls: null,
    preparedSignatureSnapshot: null,
    approvedSignatureSnapshot: null,
    paidSignatureSnapshot: null,
    history: [{ status: "draft", by: "Dina Pratiwi", at: "2026-07-28T11:00:00.000Z" }],
    createdAt: "2026-07-28T11:00:00.000Z",
    updatedAt: "2026-07-28T11:00:00.000Z",
  }),
];
