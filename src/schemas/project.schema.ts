import { z } from "zod";

export const projectSchema = z.object({
  name: z
    .string()
    .min(1, "Nama project wajib diisi")
    .min(3, "Nama project minimal 3 karakter")
    .max(100, "Nama project maksimal 100 karakter"),
  code: z
    .string()
    .min(1, "Kode project wajib diisi")
    .regex(/^[A-Z0-9-]+$/, "Kode project hanya boleh huruf kapital, angka, dan tanda minus"),
  description: z.string().optional(),
  clientName: z.string().optional(),
  picName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["ongoing", "completed", "on_hold", "cancelled"]),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
