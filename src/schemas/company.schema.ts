import { z } from "zod";

export const PV_RESET_MODES = ["monthly", "yearly", "never"] as const;

export const PV_RESET_MODE_LABELS: Record<(typeof PV_RESET_MODES)[number], string> = {
  monthly: "Tiap bulan",
  yearly: "Tiap tahun",
  never: "Tidak pernah",
};

export const companySchema = z.object({
  name: z.string().min(1, "Nama perusahaan wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
  npwp: z.string().min(1, "NPWP wajib diisi"),
  phone: z.string().min(1, "Telepon wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Email tidak valid"),
  website: z.string().max(255, "Maksimal 255 karakter").default(""),
  // Penomoran PV - lihat src/lib/pv-voucher-number.ts. Default-nya sama
  // persis dengan format lama (YYMM45XXXX, reset bulanan).
  pvCode: z.string().regex(/^\d{1,5}$/, "Kode harus 1-5 digit angka").default("45"),
  pvSeqLength: z.coerce
    .number({ invalid_type_error: "Harus berupa angka" })
    .int("Harus bilangan bulat")
    .min(3, "Minimal 3 digit")
    .max(6, "Maksimal 6 digit")
    .default(4),
  pvResetMode: z.enum(PV_RESET_MODES).default("monthly"),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
