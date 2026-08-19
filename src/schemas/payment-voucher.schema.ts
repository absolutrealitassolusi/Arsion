import { z } from "zod";

export const paymentVoucherItemSchema = z.object({
  category: z.enum(["barang", "jasa", "freelance", "non_pajak"]),
  description: z.string().min(1, "Keterangan item wajib diisi"),
  qty: z.coerce.number({ invalid_type_error: "Qty harus berupa angka" }).positive("Qty harus lebih dari 0"),
  unitPrice: z.coerce
    .number({ invalid_type_error: "Harga satuan harus berupa angka" })
    .min(0, "Harga satuan tidak boleh negatif"),
});

export const paymentVoucherSchema = z.object({
  direction: z.enum(["in", "out"], { required_error: "Arah transaksi wajib dipilih" }),
  date: z.string().min(1, "Tanggal wajib diisi"),
  senderBank: z.string().min(1, "Bank pengirim wajib dipilih"),
  partyName: z.string().min(1, "Nama vendor/customer wajib diisi"),
  description: z.string().min(1, "Keterangan wajib diisi"),
  items: z.array(paymentVoucherItemSchema).min(1, "Minimal 1 item"),
  ppnPercent: z.coerce.number().min(0, "Minimal 0%").max(100, "Maksimal 100%"),
  pphJasaPercent: z.coerce.number().min(0, "Minimal 0%").max(100, "Maksimal 100%"),
  pphFreelancePercent: z.coerce.number().min(0, "Minimal 0%").max(100, "Maksimal 100%"),
  paymentMethod: z.enum(["transfer", "cash", "cheque"]),
  receiverBankName: z.string().optional(),
  receiverAccountName: z.string().optional(),
  receiverAccountNumber: z.string().optional(),
  projectNumber: z.string().nullable().optional(),
  poNumber: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  taxInvoiceNumber: z.string().nullable().optional(),
  attachmentName: z.string().nullable().optional(),
  attachmentUrls: z.array(z.string()).nullable().optional(),
});

export type PaymentVoucherItemValues = z.infer<typeof paymentVoucherItemSchema>;
export type PaymentVoucherFormValues = z.infer<typeof paymentVoucherSchema>;
