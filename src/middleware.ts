import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

/**
 * Gerbang cepat (Edge) buat semua halaman - refresh session Supabase (kalau
 * access token-nya udah kedaluwarsa tapi refresh token masih valid, cookie
 * baru ditulis ke response ini) lalu redirect berdasarkan status login.
 * Data user yang beneran (nama, role, permission) tetap di-resolve
 * server-side per-halaman lewat `getCurrentUser()` di `(dashboard)/layout.tsx`.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Kalau env belum lengkap, anggap semua orang "belum login" (fail closed,
  // bukan fail open) - daripada bikin middleware crash total buat semua request.
  if (!url || !anonKey) {
    const isPublicPath = PUBLIC_PATHS.includes(pathname);
    if (!isPublicPath) return NextResponse.redirect(new URL("/login", request.url));
    return response;
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
  const isAuthenticated = Boolean(user);
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/forgot-password")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
