// Sejumlah test Route Handler (yang kena migrasi Prisma -> Drizzle) jalan
// sebagai integration test lawan DB dev asli, bukan mock - butuh
// DATABASE_URL kebaca dari .env, yang gak otomatis ke-load Vitest kayak
// Next.js dev server.
import "dotenv/config";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest gak auto-detect & bersihin DOM antar-test kaya Jest (kita gak
// pakai `test.globals: true`) - jadi bersihin manual biar test komponen
// gak numpuk render dari test sebelumnya.
afterEach(() => {
  cleanup();
});
