import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { uploadFile, validateFile, type UploadKind } from "@/lib/file-storage";

const VALID_KINDS: UploadKind[] = ["pv-attachment", "pv-payment-proof", "pv-tax-proof", "signature"];

/**
 * POST /uploads - upload generik (bukan terikat 1 voucher/user tertentu),
 * dipakai buat semua titik upload file di app ini (Lampiran/Bukti
 * Pembayaran/Bukti Pajak PV, tanda tangan User) - Lampiran PV misalnya
 * diupload SEBELUM voucher-nya sendiri punya id (saat create), jadi gak
 * bisa digantungin ke route [id]. Permission sebenarnya (mis. PV_PAY buat
 * bukti pembayaran) tetap ditegakkan di endpoint SAVE masing-masing seperti
 * sekarang - siapapun yang login boleh upload, cuma nyimpen path ke record
 * yang butuh permission tersendiri.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File tidak ditemukan di request." }, { status: 400 });
  }
  if (typeof kind !== "string" || !VALID_KINDS.includes(kind as UploadKind)) {
    return NextResponse.json({ message: "Kind upload tidak valid." }, { status: 400 });
  }

  const validation = validateFile(file);
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  try {
    const path = await uploadFile(kind as UploadKind, auth.user.id, file);
    return NextResponse.json({ data: { path } }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal upload file.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
