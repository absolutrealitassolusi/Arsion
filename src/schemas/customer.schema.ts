import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .min(1, "Nama customer wajib diisi")
    .min(3, "Nama customer minimal 3 karakter")
    .max(100, "Nama customer maksimal 100 karakter"),
  code: z
    .string()
    .min(1, "Kode customer wajib diisi")
    .regex(/^[A-Z0-9-]+$/, "Kode customer hanya boleh huruf kapital, angka, dan tanda minus"),
  npwp: z.string().min(1, "NPWP wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  phone: z.string().optional(),
  address: z.string().min(1, "Alamat wajib diisi"),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
