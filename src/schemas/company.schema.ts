import { z } from "zod";

/** Isi awal daftar bank perusahaan - sama dengan SiPV (juga jadi default kolom Company.banks). */
export const DEFAULT_COMPANY_BANKS = ["Bank OCBC", "Bank Mandiri", "Bank BRI", "Petty Cash"];

/** Textarea "satu bank per baris" -> array (baris kosong & spasi di pinggir dibuang). */
export function parseBankLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

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
  banks: z
    .array(z.string().trim().min(1))
    .min(1, "Minimal 1 bank")
    .refine((list) => new Set(list).size === list.length, "Ada nama bank yang dobel")
    .default(DEFAULT_COMPANY_BANKS),
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
