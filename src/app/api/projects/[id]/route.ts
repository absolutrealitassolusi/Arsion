import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/db/schema";
import { requireUser, requirePermission } from "@/lib/api-auth";
import { serializeProject } from "@/lib/serialize-project";
import { logActivity } from "@/lib/activity-log";
import { projectSchema } from "@/schemas/project.schema";
import { PERMISSIONS } from "@/config/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!project) {
    return NextResponse.json({ message: "Project tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: serializeProject(project) });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_PROJECT);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Data tidak valid.", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Project tidak ditemukan" }, { status: 404 });
  }

  const [codeTaken] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.code, parsed.data.code), ne(projects.id, id)))
    .limit(1);
  if (codeTaken) {
    return NextResponse.json({ message: "Kode project sudah dipakai." }, { status: 409 });
  }

  const [project] = await db
    .update(projects)
    .set({
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    })
    .where(eq(projects.id, id))
    .returning();
  await logActivity(auth.user.name, "Edit Project", `${project!.name} (${project!.code})`);
  return NextResponse.json({ data: serializeProject(project!) });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission(PERMISSIONS.MASTER_DATA_PROJECT);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ message: "Project tidak ditemukan" }, { status: 404 });
  }

  await db.delete(projects).where(eq(projects.id, id));
  await logActivity(auth.user.name, "Hapus Project", `${existing.name} (${existing.code})`);
  return NextResponse.json({ message: "Project berhasil dihapus" });
}
