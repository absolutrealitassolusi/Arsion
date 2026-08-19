import type {
  PaymentVoucher as ApiPaymentVoucher,
  PaymentVoucherHistoryEntry,
  PaymentVoucherItem,
  PaymentMethod,
  PvDirection,
  PvStatus,
} from "@/types/payment-voucher";

interface PrismaPaymentVoucher {
  id: string;
  voucherNumber: string;
  direction: PvDirection;
  date: Date;
  senderBank: string;
  partyName: string;
  description: string;
  items: unknown;
  ppnPercent: number;
  pphJasaPercent: number;
  pphFreelancePercent: number;
  subtotal: number;
  ppnAmount: number;
  pphJasaAmount: number;
  pphFreelanceAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  receiverBankName: string;
  receiverAccountName: string;
  receiverAccountNumber: string;
  projectNumber: string | null;
  poNumber: string | null;
  invoiceNumber: string | null;
  taxInvoiceNumber: string | null;
  attachmentName: string | null;
  attachmentUrls: string[];
  status: PvStatus;
  preparedBy: string;
  approvedBy: string | null;
  paidBy: string | null;
  paymentProofFileName: string | null;
  paymentProofUrls: string[];
  taxProofFileName: string | null;
  taxProofUrls: string[];
  preparedSignatureSnapshot: string | null;
  approvedSignatureSnapshot: string | null;
  paidSignatureSnapshot: string | null;
  history: unknown;
  createdAt: Date;
  updatedAt: Date;
}

/** Kolom `String[]` di Prisma gak punya "null", cuma array kosong - dipetakan balik ke null biar kontrak API-nya sama persis kaya mock (`string[] | null`). */
const urlsOrNull = (urls: string[]) => (urls.length > 0 ? urls : null);

export function serializePaymentVoucher(voucher: PrismaPaymentVoucher): ApiPaymentVoucher {
  return {
    id: voucher.id,
    voucherNumber: voucher.voucherNumber,
    direction: voucher.direction,
    date: voucher.date.toISOString().slice(0, 10),
    senderBank: voucher.senderBank,
    partyName: voucher.partyName,
    description: voucher.description,
    items: voucher.items as PaymentVoucherItem[],
    ppnPercent: voucher.ppnPercent,
    pphJasaPercent: voucher.pphJasaPercent,
    pphFreelancePercent: voucher.pphFreelancePercent,
    subtotal: voucher.subtotal,
    ppnAmount: voucher.ppnAmount,
    pphJasaAmount: voucher.pphJasaAmount,
    pphFreelanceAmount: voucher.pphFreelanceAmount,
    totalAmount: voucher.totalAmount,
    paymentMethod: voucher.paymentMethod,
    receiverBankName: voucher.receiverBankName,
    receiverAccountName: voucher.receiverAccountName,
    receiverAccountNumber: voucher.receiverAccountNumber,
    projectNumber: voucher.projectNumber,
    poNumber: voucher.poNumber,
    invoiceNumber: voucher.invoiceNumber,
    taxInvoiceNumber: voucher.taxInvoiceNumber,
    attachmentName: voucher.attachmentName,
    attachmentUrls: urlsOrNull(voucher.attachmentUrls),
    status: voucher.status,
    preparedBy: voucher.preparedBy,
    approvedBy: voucher.approvedBy,
    paidBy: voucher.paidBy,
    paymentProofFileName: voucher.paymentProofFileName,
    paymentProofUrls: urlsOrNull(voucher.paymentProofUrls),
    taxProofFileName: voucher.taxProofFileName,
    taxProofUrls: urlsOrNull(voucher.taxProofUrls),
    preparedSignatureSnapshot: voucher.preparedSignatureSnapshot,
    approvedSignatureSnapshot: voucher.approvedSignatureSnapshot,
    paidSignatureSnapshot: voucher.paidSignatureSnapshot,
    history: voucher.history as PaymentVoucherHistoryEntry[],
    createdAt: voucher.createdAt.toISOString(),
    updatedAt: voucher.updatedAt.toISOString(),
  };
}
