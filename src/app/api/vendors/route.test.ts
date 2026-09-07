import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { vendors } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requireUser } from "@/lib/api-auth";
import { GET } from "./route";

const requireUserMock = vi.mocked(requireUser);
const fakeUser = { id: "u1", name: "Dina Pratiwi", email: "dina@arsion.app", roleNames: [], permissions: [] };

/**
 * Integration test lawan DB dev Supabase asli (bukan mock) - lihat memory
 * `prisma-7-slow-query-engine` / plan migrasi Drizzle buat alasannya:
 * query builder Drizzle gak bisa di-mock rapi kayak client Prisma yang flat.
 * Semua data yang dibikin test ini dikasih prefix unik & dibersihin di
 * `afterEach`, jadi gak ninggalin sampah di DB dev.
 */
const TEST_PREFIX = "VITEST-VENDOR-";

function makeRequest(url: string) {
  return new NextRequest(url);
}

beforeEach(() => {
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ user: fakeUser });
});

afterEach(async () => {
  await db.delete(vendors).where(ilike(vendors.id, `${TEST_PREFIX}%`));
});

describe("GET /api/vendors", () => {
  it("tanpa query search, balikin vendor yang ada", async () => {
    await db.insert(vendors).values({
      name: "PT Sumber Makmur",
      id: `${TEST_PREFIX}001`,
      npwp: "123",
      address: "Jl. A",
      bankName: "BCA",
      bankAccountNumber: "1",
      bankAccountName: "PT Sumber Makmur",
    });

    const res = await GET(makeRequest("http://localhost/api/vendors"));
    const body = (await res.json()) as { data: Array<{ code: string }>; total: number };

    expect(body.data.some((v) => v.code === `${TEST_PREFIX}001`)).toBe(true);
  });

  it("dengan query search, nyari case-insensitive di name ATAU code", async () => {
    await db.insert(vendors).values([
      {
        name: "PT Sumber Makmur",
        id: `${TEST_PREFIX}002`,
        npwp: "123",
        address: "Jl. A",
        bankName: "BCA",
        bankAccountNumber: "1",
        bankAccountName: "PT Sumber Makmur",
      },
      {
        name: "CV Cipta Karya",
        id: `${TEST_PREFIX}003`,
        npwp: "456",
        address: "Jl. B",
        bankName: "BNI",
        bankAccountNumber: "2",
        bankAccountName: "CV Cipta Karya",
      },
    ]);

    const res = await GET(makeRequest("http://localhost/api/vendors?search=SUMBER"));
    const body = (await res.json()) as { data: Array<{ code: string }> };
    const codes = body.data.map((v) => v.code);

    expect(codes).toContain(`${TEST_PREFIX}002`);
    expect(codes).not.toContain(`${TEST_PREFIX}003`);
  });

  it("balikin total sesuai jumlah data yang ketemu", async () => {
    await db.insert(vendors).values({
      name: "PT Unique Total Test",
      id: `${TEST_PREFIX}004`,
      npwp: "789",
      address: "Jl. C",
      bankName: "Mandiri",
      bankAccountNumber: "3",
      bankAccountName: "PT Unique Total Test",
    });

    const res = await GET(makeRequest(`http://localhost/api/vendors?search=${TEST_PREFIX}004`));
    const body = (await res.json()) as { data: unknown[]; total: number };

    expect(body.total).toBe(1);
    expect(body.data).toHaveLength(1);
  });

  it("balikin error auth kalau belum login", async () => {
    const { NextResponse } = await import("next/server");
    requireUserMock.mockResolvedValue({ error: NextResponse.json({ message: "Belum login." }, { status: 401 }) });

    const res = await GET(makeRequest("http://localhost/api/vendors"));

    expect(res.status).toBe(401);
  });
});
