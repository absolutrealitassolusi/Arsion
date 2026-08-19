import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth pakai httpOnly session cookie (bukan bearer token) - browser otomatis
// ngirim cookie-nya di tiap request same-origin, gak perlu header manual.

// Response interceptor - normalize error shape
export interface ApiErrorShape {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const normalized: ApiErrorShape = {
      message:
        error.response?.data?.message ??
        error.message ??
        "Terjadi kesalahan tak terduga. Silakan coba lagi.",
      status: error.response?.status,
      errors: error.response?.data?.errors,
    };
    return Promise.reject(normalized);
  }
);

/**
 * Ambil pesan error yang aman ditampilkan ke user, dari sumber manapun -
 * `ApiErrorShape` (hasil normalize di atas, BUKAN instance `Error`, jadi
 * `err instanceof Error` selalu gagal buat ini) ATAU `Error` biasa (mis.
 * dari validasi client-side yang throw langsung, bukan lewat axios).
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return fallback;
}
