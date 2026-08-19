import "dotenv/config";
import { randomBytes } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

/** 4 akun seed (lihat src/mocks/data/users.ts) - dipertahankan pakai password seed yang sama biar e2e/auth.setup.ts & alur dev gak putus. */
const SEED_EMAIL_DOMAIN = "@arsion.app";
const SEED_PASSWORD = "Ares@2026";

function randomTempPassword(): string {
  // 12 karakter hex acak + 1 huruf besar + 1 angka dipaksa di depan biar lolos validasi umum "harus ada huruf besar/angka".
  return `Tmp${randomBytes(9).toString("hex")}`;
}

async function main() {
  const pending = await db.select().from(users).where(isNull(users.authUserId));
  if (pending.length === 0) {
    console.log("Semua user sudah ke-link ke Supabase Auth - tidak ada yang perlu dimigrasi.");
    return;
  }

  console.log(`Memigrasi ${pending.length} user ke Supabase Auth...\n`);
  const supabaseAdmin = createSupabaseAdminClient();
  const results: { email: string; password: string; ok: boolean; note?: string }[] = [];

  for (const user of pending) {
    const isSeed = user.email.endsWith(SEED_EMAIL_DOMAIN);
    const password = isSeed ? SEED_PASSWORD : randomTempPassword();

    let { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
    });

    // Idempotent: kalau sempat kepotong di run sebelumnya (auth user sudah
    // kebentuk tapi authUserId belum sempat disimpan), jangan gagal - cari
    // user Supabase Auth yang emailnya cocok, pakai id-nya.
    if (error?.message.toLowerCase().includes("already been registered")) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === user.email);
      if (existing) {
        data = { user: existing };
        error = null;
      }
    }

    if (error || !data?.user) {
      results.push({ email: user.email, password: "-", ok: false, note: error?.message ?? "unknown error" });
      continue;
    }

    await db.update(users).set({ authUserId: data.user.id }).where(eq(users.id, user.id));
    results.push({ email: user.email, password, ok: true, note: isSeed ? "akun seed" : "PASSWORD SEMENTARA" });
  }

  console.log("Hasil migrasi:\n");
  for (const r of results) {
    console.log(`${r.ok ? "OK  " : "GAGAL"} | ${r.email.padEnd(30)} | ${r.password.padEnd(20)} | ${r.note}`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.log(`\n${failed.length} user GAGAL dimigrasi - cek pesan error di atas, jalankan ulang script ini setelah diperbaiki.`);
  }
  console.log(
    "\nPENTING: kasih tau password sementara di atas ke user yang bersangkutan lewat jalur aman (bukan lewat channel publik) - mereka wajib ganti sendiri lewat 'Ganti Password' di Profil Saya setelah login pertama kali."
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
