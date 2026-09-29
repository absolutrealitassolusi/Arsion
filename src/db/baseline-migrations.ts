import "dotenv/config";
import { Pool } from "pg";
import { readMigrationFiles } from "drizzle-orm/migrator";

/**
 * One-time adoption step: the "0000" migration is a fresh CREATE TABLE/TYPE
 * dump of schema.ts, but the tables already exist on this DB (pre-dating
 * drizzle-kit). Running it for real would fail on "already exists", so
 * instead we record ONLY that first migration as already-applied in
 * drizzle's own bookkeeping table, using drizzle's own hash/timestamp logic
 * (readMigrationFiles) so `db:migrate` agrees it's done and skips it - any
 * later migrations (0001+) are real schema changes and get applied for real
 * by `db:migrate` afterwards, not stamped here. Safe to re-run: skips if a
 * migration is already recorded.
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
  const baseline = migrations[0];
  if (!baseline) {
    throw new Error("No migrations found in ./drizzle.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const { rows } = await pool.query(
      `SELECT id FROM "drizzle"."__drizzle_migrations" LIMIT 1`
    );
    if (rows.length > 0) {
      console.log("Already stamped - a migration record already exists, skipping.");
      return;
    }

    await pool.query(
      `INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
      [baseline.hash, baseline.folderMillis]
    );
    console.log(`Stamped baseline migration as applied (hash=${baseline.hash}, created_at=${baseline.folderMillis}).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
