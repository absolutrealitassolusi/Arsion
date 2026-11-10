import { z } from "zod";

/**
 * Kode boleh dikosongkan - server otomatis isi kode berikutnya (lihat
 * src/lib/next-master-code.ts). NPWP, alamat, dan rekening boleh kosong
 * (sama kayak SiPV) - vendor perorangan / data yang belum lengkap tetap bisa
 * dicatat, dilengkapi belakangan lewat Edit.
 */
export const vendorSchema = z.object({
  name: z
    .string()
    .min(1, "Nama vendor wajib diisi")
    .min(3, "Nama vendor minimal 3 karakter")
    .max(100, "Nama vendor maksimal 100 karakter"),
  code: z
    .string()
    .regex(/^[A-Z0-9-]*$/, "Kode vendor hanya boleh huruf kapital, angka, dan tanda minus")
    .default(""),
  npwp: z.string().default(""),
  phone: z.string().optional(),
  address: z.string().default(""),
  bankName: z.string().default(""),
  bankAccountNumber: z.string().default(""),
  bankAccountName: z.string().default(""),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
