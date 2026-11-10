import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeCustomer } from "@/lib/serialize-customer";
import { logActivity } from "@/lib/activity-log";
import { customerSchema } from "@/schemas/customer.schema";
import { PERMISSIONS } from "@/config/permissions";
import { isUniqueViolation, nextCodeFor } from "@/lib/master-code-db";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  // Default nampilin yang aktif aja (customer nonaktif disembunyikan dari
  // daftar utama) - minta ?status=inactive eksplisit buat lihat yang nonaktif.
  const status = searchParams.get("status") === "inactive" ? "inactive" : "active";

  const conditions = [
    eq(customers.status, status),
    search ? or(ilike(customers.name, `%${search}%`), ilike(customers.id, `%${search}%`)) : undefined,
  ].filter((c) => c !== undefined);

  const rows = await db
    .select()
    .from(customers)
    .where(and(...conditions))
    .orderBy(desc(customers.createdAt));

  const data = rows.map(serializeCustomer);
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_CUSTOMER);
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { code: requestedCode, ...rest } = parsed.data;
  // Kode kosong = diisi otomatis (+1 dari kode terbesar, lihat src/lib/next-master-code.ts).
  const code = requestedCode || (await nextCodeFor("customer"));

  const [existing] = await db.select().from(customers).where(eq(customers.id, code)).limit(1);
  if (existing) {
    return NextResponse.json({ message: "Kode customer sudah dipakai." }, { status: 409 });
  }

  let customer: typeof customers.$inferSelect | undefined;
  try {
    [customer] = await db.insert(customers).values({ ...rest, id: code }).returning();
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ message: "Kode customer baru saja dipakai orang lain, coba simpan lagi." }, { status: 409 });
    }
    throw err;
  }
  await logActivity(auth.user.name, "Tambah Customer", `${customer!.name} (${customer!.id})`);
  return NextResponse.json({ data: serializeCustomer(customer!) }, { status: 201 });
}
