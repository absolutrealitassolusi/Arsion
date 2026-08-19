import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Default "node" buat test logic/API (gak butuh DOM) - test komponen
    // yang butuh DOM opt-in sendiri lewat komentar "// @vitest-environment
    // jsdom" di baris pertama filenya.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    // Test integration yang beneran connect ke DB dev (bukan mock) kadang
    // kena cold-start koneksi pool pertama ~1-9 detik (sama kayak alasan
    // Playwright juga naikin timeout-nya, lihat playwright.config.ts).
    testTimeout: 20_000,
  },
});
