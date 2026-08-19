import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase pakai service role key - buat operasi admin Auth
 * (`auth.admin.createUser()` dst, dipanggil dari `POST /api/users` &
 * `src/db/migrate-users-to-supabase-auth.ts`). Server-only, sama alasannya
 * kaya src/lib/file-storage.ts - jangan pernah diimpor dari kode client.
 */
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage/Auth admin belum dikonfigurasi - isi SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY di .env."
    );
  }
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
