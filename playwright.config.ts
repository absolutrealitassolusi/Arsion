import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Jalanin 1 test sekaligus - beberapa test lupa lewat alur login penuh
  // (findUnique + update lastLogin ke Postgres), dan koneksi direct ke
  // Supabase (bukan pooler, lihat docs/BACKEND-STATUS.md) kewalahan kalau
  // ke-hit bersamaan dari banyak worker - request-nya nggantung sampai timeout.
  workers: 1,
  retries: 0,
  reporter: "list",
  // Default 5 detik kadang kepotong kalau koneksi ke Supabase (region
  // Korea) lagi lambat - sama root cause-nya kaya timeout $transaction pas
  // create PV, dinaikkan di sini juga biar konsisten.
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    actionTimeout: 20_000,
  },
  // reuseExistingServer: true - kalau dev server udah jalan (kaya biasanya
  // pas sesi kerja), dipakai langsung; kalau belum, Playwright yang nyalain.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/dina.json" },
      dependencies: ["setup"],
    },
  ],
});
