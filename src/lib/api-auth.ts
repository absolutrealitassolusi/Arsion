import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import type { Permission } from "@/config/permissions";
import type { CurrentUser } from "@/types/auth";

type AuthResult = { user: CurrentUser } | { error: NextResponse };

/** Wajib login (permission apapun boleh) - dipakai buat semua GET Route Handler. */
export async function requireUser(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ message: "Belum login." }, { status: 401 }) };
  }
  return { user };
}

/** Wajib login DAN punya permission tertentu - dipakai buat Route Handler yang mengubah data. */
export async function requirePermission(permission: Permission): Promise<AuthResult> {
  const result = await requireUser();
  if ("error" in result) return result;
  if (!result.user.permissions.includes(permission)) {
    return { error: NextResponse.json({ message: "Kamu tidak punya izin untuk aksi ini." }, { status: 403 }) };
  }
  return result;
}
