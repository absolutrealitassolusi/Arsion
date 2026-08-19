import { api } from "@/lib/axios";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { ForgotPasswordValues, LoginValues } from "@/schemas/auth.schema";
import type { ProfileFormValues } from "@/schemas/profile.schema";
import type { CurrentUser } from "@/types/auth";

export interface AuthUser {
  email: string;
}

export const authService = {
  async login(values: LoginValues): Promise<AuthUser> {
    const { data } = await api.post<{ data: AuthUser }>("/auth/login", values);
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async updateProfile(values: ProfileFormValues): Promise<CurrentUser> {
    const { data } = await api.patch<{ data: CurrentUser }>("/auth/me", values);
    return data.data;
  },

  /** Beneran kirim email reset lewat Supabase Auth - client-side, anon key. */
  async requestPasswordReset(values: ForgotPasswordValues): Promise<{ message: string }> {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      throw { message: error.message };
    }
    return { message: `Link reset password telah dikirim ke ${values.email}` };
  },

  /**
   * Set password baru - dipakai dari 2 tempat: halaman /reset-password
   * (setelah klik link reset) dan seksi "Ganti Password" di Profil Saya.
   * Keduanya butuh session Supabase yang valid (recovery session utk yang
   * pertama, session login normal utk yang kedua) - `updateUser` bekerja sama
   * buat keduanya.
   */
  async updatePassword(newPassword: string): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw { message: error.message };
    }
  },
};
