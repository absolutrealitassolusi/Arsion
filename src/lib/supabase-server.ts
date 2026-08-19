import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase Auth belum dikonfigurasi - isi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY di .env (lihat .env.example)."
    );
  }
  return { url, anonKey };
}

/**
 * Client Supabase buat Server Component / Route Handler - baca/tulis
 * session lewat cookie `next/headers`. Di Server Component, `set()` akan
 * gagal (Server Component gak boleh nulis cookie) - itu aman diabaikan
 * karena `src/middleware.ts` yang nanganin refresh token per-request;
 * Route Handler (login/logout/dst) BISA nulis cookie normal.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component - diabaikan, middleware yang refresh session.
        }
      },
    },
  });
}
