import { z } from "zod";

export const userSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  department: z.string().min(1, "Department wajib dipilih"),
  position: z.string().min(1, "Position wajib dipilih"),
  roles: z.array(z.string()).min(1, "Pilih minimal 1 role"),
  status: z.enum(["active", "inactive"]),
});

export type UserFormValues = z.infer<typeof userSchema>;

/** Dipakai khusus mode Tambah User - butuh password awal, mode Edit tidak. */
export const createUserSchema = userSchema.extend({
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
