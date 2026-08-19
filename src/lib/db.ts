import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";

// Next.js hot-reloads modules in dev - without stashing the pool on
// globalThis, every reload would open a new DB connection pool.
const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    // Kecil sengaja - di Vercel (serverless) tiap function instance jalan
    // sebagai proses terpisah, jadi total koneksi ke Postgres = jumlah
    // instance x max ini. Pool besar per-instance gampang ngabisin slot
    // koneksi pooler Supabase pas banyak instance jalan bersamaan. 1 request
    // di app ini gak pernah butuh lebih dari 1 koneksi bersamaan (gak ada
    // query paralel dalam 1 handler), jadi max kecil gak bikin request
    // nunggu antre.
    max: process.env.NODE_ENV === "production" ? 3 : 10,
  });
}

const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
