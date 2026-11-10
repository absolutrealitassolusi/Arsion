import { z } from "zod";

export const paymentVoucherItemSchema = z.object({
  category: z.enum(["barang", "jasa", "freelance", "non_pajak"]),
  description: z.string().min(1, "Keterangan item wajib diisi"),
  qty: z.coerce.number({ invalid_type_error: "Qty harus berupa angka" }).positive("Qty harus lebih dari 0"),
  unitPrice: z.coerce
    .number({ invalid_type_error: "Harga satuan harus berupa angka" })
    .min(0, "Harga satuan tidak boleh negatif"),
});

export const pvFileSchema = z.object({
  name: z.string().min(1),
  urls: z.array(z.string().min(1)).min(1),
});

/** Tanggal hari ini (YYYY-MM-DD) di zona waktu WIB - dipakai server & browser biar hasilnya sama. */
export function todayInJakarta(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
}

export const paymentVoucherSchema = z.object({
  direction: z.enum(["in", "out"], { required_error: "Arah transaksi wajib dipilih" }),
  date: z
    .string()
    .min(1, "Tanggal wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
    // Nomor PV ikut YYMM tanggal PV - tanggal maju bikin nomor bulan depan
    // kepakai duluan, jadi ditolak (sama kayak aturan di SiPV).
    .refine((value) => value <= todayInJakarta(), "Tanggal PV tidak boleh lebih maju dari hari ini"),
  senderBank: z.string().min(1, "Bank pengirim wajib dipilih"),
  partyName: z.string().min(1, "Nama vendor/customer wajib diisi"),
  description: z.string().min(1, "Keterangan wajib diisi"),
  items: z.array(paymentVoucherItemSchema).min(1, "Minimal 1 item"),
  ppnPercent: z.coerce.number().min(0, "Minimal 0%").max(100, "Maksimal 100%"),
  pphJasaPercent: z.coerce.number().min(0, "Minimal 0%").max(100, "Maksimal 100%"),
  pphFreelancePercent: z.coerce.number().min(0, "Minimal 0%").max(100, "Maksimal 100%"),
  paymentMethod: z.enum(["transfer", "cash", "cheque", "giro"]),
  receiverBankName: z.string().optional(),
  receiverAccountName: z.string().optional(),
  receiverAccountNumber: z.string().optional(),
  projectNumber: z.string().nullable().optional(),
  poNumber: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  taxInvoiceNumber: z.string().nullable().optional(),
  // Boleh lebih dari 1 file (sama kayak SiPV) - lihat src/lib/pv-files.ts.
  attachments: z.array(pvFileSchema).max(20, "Maksimal 20 file").default([]),
});

/** Body PATCH /payment-vouchers/:id/pay - bukti pembayaran wajib (tanggal dibayar = saat bukti di-upload). */
export const markPaidSchema = z.object({
  paymentProofs: z.array(pvFileSchema).min(1, "Upload minimal 1 bukti pembayaran").max(20, "Maksimal 20 file"),
  paymentNote: z.string().trim().max(500, "Maksimal 500 karakter").optional(),
});

/** Body PATCH /payment-vouchers/:id/payment-proof - ganti/tambah bukti setelah dibayar. */
export const paymentProofSchema = z.object({
  paymentProofs: z.array(pvFileSchema).min(1, "Minimal 1 bukti pembayaran").max(20, "Maksimal 20 file"),
  paymentNote: z.string().trim().max(500, "Maksimal 500 karakter").optional(),
});

export type PaymentVoucherItemValues = z.infer<typeof paymentVoucherItemSchema>;
export type PaymentVoucherFormValues = z.infer<typeof paymentVoucherSchema>;
