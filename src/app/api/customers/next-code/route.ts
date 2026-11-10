import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { nextCodeFor } from "@/lib/master-code-db";
import { PERMISSIONS } from "@/config/permissions";

// GET /customers/next-code - usulan kode buat form Tambah (+1 dari kode terbesar).
// Cuma usulan: kode final ditentukan pas POST, dan user tetap boleh ganti manual.
export async function GET() {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_CUSTOMER);
  if ("error" in auth) return auth.error;

  return NextResponse.json({ data: { code: await nextCodeFor("customer") } });
}
