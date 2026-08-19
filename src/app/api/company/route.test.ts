import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { company } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requireUser, requirePermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/config/permissions";
import { GET, PUT } from "./route";

const requireUserMock = vi.mocked(requireUser);
const requirePermissionMock = vi.mocked(requirePermission);

const fakeUser = { id: "u1", name: "Dina Pratiwi", email: "dina@arsion.app", roleNames: [], permissions: [] };

const validBody = {
  name: "PT. Absolut Realitas Solusi",
  address: "Jl. Contoh No. 1\nJakarta Selatan",
  npwp: "01.234.567.8-901.000",
  phone: "021-5551234",
  email: "info@arsion.app",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/company", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

/**
 * Integration test lawan DB dev asli - Company itu singleton (max 1 row),
 * jadi tiap test perlu ngatur sendiri kondisi awal (ada row/gak ada row)
 * dan negara aslinya (sebelum test-test ini jalan) dipulihin di akhir lewat
 * `afterAll`, biar data Company yang beneran dipakai user gak ke-corrupt.
 */
let originalRow: typeof company.$inferSelect | null = null;

beforeAll(async () => {
  const [existing] = await db.select().from(company).limit(1);
  originalRow = existing ?? null;
});

afterAll(async () => {
  await db.delete(company);
  if (originalRow) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = originalRow;
    await db.insert(company).values(rest);
  }
});

beforeEach(() => {
  requireUserMock.mockReset();
  requirePermissionMock.mockReset();
});

describe("GET /api/company", () => {
  it("balikin data null kalau belum pernah diisi", async () => {
    await db.delete(company);
    requireUserMock.mockResolvedValue({ user: fakeUser });

    const res = await GET();
    const body = (await res.json()) as { data: unknown };

    expect(body.data).toBeNull();
  });

  it("balikin data company kalau udah ada", async () => {
    await db.delete(company);
    await db.insert(company).values(validBody);
    requireUserMock.mockResolvedValue({ user: fakeUser });

    const res = await GET();
    const body = (await res.json()) as { data: { name: string } };

    expect(body.data.name).toBe(validBody.name);
  });
});

describe("PUT /api/company", () => {
  it("balikin 403 kalau gak punya izin MASTER_DATA_COMPANY", async () => {
    const { NextResponse } = await import("next/server");
    requirePermissionMock.mockResolvedValue({
      error: NextResponse.json({ message: "Kamu tidak punya izin untuk aksi ini." }, { status: 403 }),
    });

    const res = await PUT(makeRequest(validBody));

    expect(res.status).toBe(403);
  });

  it("cek permission yang dipakai adalah MASTER_DATA_COMPANY", async () => {
    requirePermissionMock.mockResolvedValue({ user: fakeUser });

    await PUT(makeRequest(validBody));

    expect(requirePermissionMock).toHaveBeenCalledWith(PERMISSIONS.MASTER_DATA_COMPANY);
  });

  it("balikin 400 kalau body gak valid", async () => {
    requirePermissionMock.mockResolvedValue({ user: fakeUser });

    const res = await PUT(makeRequest({ ...validBody, email: "bukan-email" }));

    expect(res.status).toBe(400);
  });

  it("update row yang ada kalau row-nya udah ada", async () => {
    await db.delete(company);
    const [existing] = await db
      .insert(company)
      .values({ ...validBody, name: "Nama Lama" })
      .returning();
    requirePermissionMock.mockResolvedValue({ user: fakeUser });

    const res = await PUT(makeRequest(validBody));
    const body = (await res.json()) as { data: { name: string } };

    expect(res.status).toBe(200);
    expect(body.data.name).toBe(validBody.name);
    const rows = await db.select().from(company);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe(existing!.id);
  });

  it("create row baru kalau belum ada row sama sekali", async () => {
    await db.delete(company);
    requirePermissionMock.mockResolvedValue({ user: fakeUser });

    const res = await PUT(makeRequest(validBody));

    expect(res.status).toBe(200);
    const rows = await db.select().from(company);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe(validBody.name);
  });
});
