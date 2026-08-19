import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema";

// Next.js hot-reloads modules in dev - without stashing the pool on
// globalThis, every reload would open a new DB connection pool.
const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
