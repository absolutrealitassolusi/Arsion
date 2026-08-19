import { z } from "zod";

export const vendorSchema = z.object({
  name: z
    .string()
    .min(1, "Nama vendor wajib diisi")
    .min(3, "Nama vendor minimal 3 karakter")
    .max(100, "Nama vendor maksimal 100 karakter"),
  code: z
    .string()
    .min(1, "Kode vendor wajib diisi")
    .regex(/^[A-Z0-9-]+$/, "Kode vendor hanya boleh huruf kapital, angka, dan tanda minus"),
  npwp: z.string().min(1, "NPWP wajib diisi"),
  phone: z.string().optional(),
  address: z.string().min(1, "Alamat wajib diisi"),
  bankName: z.string().min(1, "Nama bank wajib diisi"),
  bankAccountNumber: z.string().min(1, "Nomor rekening wajib diisi"),
  bankAccountName: z.string().min(1, "Nama rekening bank wajib diisi"),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
