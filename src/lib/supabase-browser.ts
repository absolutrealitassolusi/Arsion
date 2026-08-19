import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase buat kode client-side ("use client") - anon key, aman diexpose ke browser. */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase Auth belum dikonfigurasi - isi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.");
  }
  return createBrowserClient(url, anonKey);
}
