import { createClient } from "@supabase/supabase-js";
import { createId } from "@paralleldrive/cuid2";
import { isRemotePath, validateFile, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, type UploadKind } from "@/lib/file-path";

export { isRemotePath, validateFile, MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, type UploadKind };

/**
 * Client Supabase pakai service role key - akses penuh, TIDAK PERNAH boleh
 * diimpor dari kode yang jalan di browser. Aman secara desain: env var ini
 * gak dikasih prefix "NEXT_PUBLIC_" (Next.js otomatis gak pernah nge-bundle
 * env var tanpa prefix itu ke client), dan file ini cuma diimpor dari Route
 * Handler (`src/app/api/*`) + script `src/db/setup-storage.ts` - gak pernah
 * dari komponen "use client". (Paket `server-only` sengaja TIDAK dipakai di
 * sini - dia selalu throw kalau dijalanin lewat `tsx` langsung di luar
 * bundler Next.js, padahal file ini juga perlu jalan dari script setup.)
 */
const BUCKET = "pv-files";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase Storage belum dikonfigurasi - isi SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY di .env (lihat .env.example)."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

export async function uploadFile(kind: UploadKind, ownerId: string, file: { arrayBuffer(): Promise<ArrayBuffer>; type: string }) {
  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const path = `${kind}/${ownerId}/${createId()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await getClient()
    .storage.from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) {
    throw new Error(`Gagal upload file ke Storage: ${error.message}`);
  }
  return path;
}

const SIGNED_URL_TTL_SECONDS = 300;

/** Passthrough kalau data lama/null, signed URL kalau path Storage baru. */
export async function resolveValue(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  if (!isRemotePath(value)) return value;

  const { data, error } = await getClient().storage.from(BUCKET).createSignedUrl(value, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    throw new Error(`Gagal membuat signed URL: ${error?.message ?? "unknown error"}`);
  }
  return data.signedUrl;
}

export async function resolveValues(values: (string | null | undefined)[]): Promise<(string | null)[]> {
  return Promise.all(values.map((v) => resolveValue(v)));
}

export async function createPrivateBucketIfMissing() {
  const client = getClient();
  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) throw new Error(`Gagal list bucket: ${listError.message}`);

  if (buckets?.some((b) => b.name === BUCKET)) {
    return { created: false };
  }

  const { error: createError } = await client.storage.createBucket(BUCKET, { public: false });
  if (createError) throw new Error(`Gagal bikin bucket: ${createError.message}`);
  return { created: true };
}

export { BUCKET };
