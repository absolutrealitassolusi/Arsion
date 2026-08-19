import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Nama perusahaan wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
  npwp: z.string().min(1, "NPWP wajib diisi"),
  phone: z.string().min(1, "Telepon wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Email tidak valid"),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
