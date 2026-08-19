import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Dipanggil dari src/middleware.ts (Edge runtime) - refresh session Supabase
 * (rotate token kalau perlu) dan balikin user hasil verifikasi + response
 * yang sudah bawa cookie ter-update. Pola resmi @supabase/ssr buat Next.js
 * middleware - beda dari supabase-server.ts karena middleware pakai
 * NextRequest/NextResponse langsung, bukan `next/headers`.
 */
export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { response, userId: null as string | null };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, userId: user?.id ?? null };
}
