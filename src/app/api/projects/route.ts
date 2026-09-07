import { NextRequest, NextResponse } from "next/server";
import { desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeProject } from "@/lib/serialize-project";
import { logActivity } from "@/lib/activity-log";
import { projectSchema } from "@/schemas/project.schema";
import { PERMISSIONS } from "@/config/permissions";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const rows = await db
    .select()
    .from(projects)
    .where(search ? or(ilike(projects.name, `%${search}%`), ilike(projects.id, `%${search}%`)) : undefined)
    .orderBy(desc(projects.createdAt));

  const data = rows.map(serializeProject);
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_PROJECT);
  if ("error" in auth) return auth.error;

  const body: unknown = await request.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(projects).where(eq(projects.id, parsed.data.code)).limit(1);
  if (existing) {
    return NextResponse.json({ message: "Kode project sudah dipakai." }, { status: 409 });
  }

  const { code, ...rest } = parsed.data;
  const [project] = await db
    .insert(projects)
    .values({
      ...rest,
      id: code,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    })
    .returning();
  await logActivity(auth.user.name, "Tambah Project", `${project!.name} (${project!.id})`);
  return NextResponse.json({ data: serializeProject(project!) }, { status: 201 });
}
