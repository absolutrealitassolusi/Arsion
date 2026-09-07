import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeCustomer } from "@/lib/serialize-customer";
import { logActivity } from "@/lib/activity-log";
import { customerSchema } from "@/schemas/customer.schema";
import { PERMISSIONS } from "@/config/permissions";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const rows = await db
    .select()
    .from(customers)
    .where(search ? or(ilike(customers.name, `%${search}%`), ilike(customers.id, `%${search}%`)) : undefined)
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

  const [existing] = await db.select().from(customers).where(eq(customers.id, parsed.data.code)).limit(1);
  if (existing) {
    return NextResponse.json({ message: "Kode customer sudah dipakai." }, { status: 409 });
  }

  const { code, ...rest } = parsed.data;
  const [customer] = await db.insert(customers).values({ ...rest, id: code }).returning();
  await logActivity(auth.user.name, "Tambah Customer", `${customer!.name} (${customer!.id})`);
  return NextResponse.json({ data: serializeCustomer(customer!) }, { status: 201 });
}
