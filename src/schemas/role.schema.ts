import { z } from "zod";

export const roleSchema = z.object({
  name: z
    .string()
    .min(1, "Nama role wajib diisi")
    .min(3, "Nama role minimal 3 karakter")
    .max(50, "Nama role maksimal 50 karakter"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
