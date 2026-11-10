import { db } from "@/lib/db";
import { customers, projects, vendors } from "@/db/schema";
import { nextMasterCode } from "@/lib/next-master-code";

export type MasterKind = "vendor" | "customer" | "project";

const DEFAULT_PREFIX: Record<MasterKind, string> = {
  vendor: "VND-",
  customer: "CST-",
  project: "PRJ-",
};

async function existingCodes(kind: MasterKind): Promise<string[]> {
  // Kode = primary key di ketiga tabel ini (lihat src/db/schema.ts).
  const table = kind === "vendor" ? vendors : kind === "customer" ? customers : projects;
  const rows = await db.select({ id: table.id }).from(table);
  return rows.map((r) => r.id);
}

/** Kode berikutnya buat Vendor/Customer/Project - termasuk yang nonaktif/diarsipkan, biar gak pernah kembar. */
export async function nextCodeFor(kind: MasterKind): Promise<string> {
  return nextMasterCode(await existingCodes(kind), DEFAULT_PREFIX[kind]);
}

/** Postgres unique_violation - dipakai buat ngubah tabrakan kode jadi 409, bukan 500. */
export function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string; cause?: { code?: string } } | null)?.code
    ?? (err as { cause?: { code?: string } } | null)?.cause?.code;
  return code === "23505";
}
