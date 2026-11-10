import { z } from "zod";

/**
 * Kode boleh dikosongkan - server otomatis isi kode berikutnya (lihat
 * src/lib/next-master-code.ts). NPWP, email, alamat, dan rekening boleh
 * kosong (sama kayak SiPV); email tetap dicek formatnya kalau diisi.
 * Rekening customer dipakai buat auto-isi rekening pengirim di PV In.
 */
export const customerSchema = z.object({
  name: z
    .string()
    .min(1, "Nama customer wajib diisi")
    .min(3, "Nama customer minimal 3 karakter")
    .max(100, "Nama customer maksimal 100 karakter"),
  code: z
    .string()
    .regex(/^[A-Z0-9-]*$/, "Kode customer hanya boleh huruf kapital, angka, dan tanda minus")
    .default(""),
  npwp: z.string().default(""),
  email: z.union([z.literal(""), z.string().email("Format email tidak valid")]).default(""),
  phone: z.string().optional(),
  address: z.string().default(""),
  bankName: z.string().default(""),
  bankAccountNumber: z.string().default(""),
  bankAccountName: z.string().default(""),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
