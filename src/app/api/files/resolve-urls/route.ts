import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { resolveValues } from "@/lib/file-storage";

/**
 * POST /files/resolve-urls - satu-satunya tempat signed URL Supabase
 * Storage dibuat, jadi satu-satunya tempat yang perlu ngecek otorisasi
 * sebelum itu terjadi (`requireUser()` - level yang sama kaya
 * `GET /payment-vouchers/[id]`, siapapun yang login boleh lihat). Generik
 * (gak terikat 1 voucher/user), dipakai lintas modul: attachment/bukti PV
 * DAN tanda tangan User. Value yang udah data URL base64 lama atau null
 * di-passthrough apa adanya (gak nyentuh Storage sama sekali).
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as { paths?: unknown };
  if (!Array.isArray(body.paths) || !body.paths.every((p) => p === null || typeof p === "string")) {
    return NextResponse.json({ message: "Body 'paths' harus berupa array string/null." }, { status: 400 });
  }

  try {
    const data = await resolveValues(body.paths as (string | null)[]);
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal resolve URL file.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
