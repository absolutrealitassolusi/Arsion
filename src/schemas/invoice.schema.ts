import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Keterangan item wajib diisi"),
  qty: z.coerce.number({ invalid_type_error: "Qty harus berupa angka" }).positive("Qty harus lebih dari 0"),
  unitPrice: z.coerce
    .number({ invalid_type_error: "Harga satuan harus berupa angka" })
    .min(0, "Harga satuan tidak boleh negatif"),
});

export const invoiceSchema = z
  .object({
    customerName: z.string().min(1, "Nama customer wajib diisi"),
    date: z.string().min(1, "Tanggal wajib diisi"),
    dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
    items: z.array(invoiceItemSchema).min(1, "Minimal 1 item"),
    ppnPercent: z.coerce.number().min(0, "Minimal 0%").max(100, "Maksimal 100%"),
    notes: z.string().nullable().optional(),
  })
  .refine((data) => data.dueDate >= data.date, {
    message: "Tanggal jatuh tempo tidak boleh sebelum tanggal invoice",
    path: ["dueDate"],
  });

export type InvoiceItemValues = z.infer<typeof invoiceItemSchema>;
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
