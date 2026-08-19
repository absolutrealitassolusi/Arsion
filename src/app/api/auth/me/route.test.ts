import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
}));

import { requireUser } from "@/lib/api-auth";
import { getCurrentUser } from "@/lib/current-user";
import { GET, PATCH } from "./route";

const requireUserMock = vi.mocked(requireUser);
const getCurrentUserMock = vi.mocked(getCurrentUser);

const TEST_PREFIX = "vitest-auth-me-";
let targetUserId: string;
let otherUserEmail: string;

/** Integration test lawan DB dev asli - lihat memory `prisma-7-slow-query-engine`. */
beforeAll(async () => {
  const [target] = await db
    .insert(users)
    .values({
      name: "Dina Pratiwi",
      email: `${TEST_PREFIX}dina@example.com`,
      department: "Finance",
      position: "Staff",
    })
    .returning();
  const [other] = await db
    .insert(users)
    .values({
      name: "User Lain",
      email: `${TEST_PREFIX}other@example.com`,
      department: "Finance",
      position: "Staff",
    })
    .returning();
  targetUserId = target!.id;
  otherUserEmail = other!.email;
});

afterAll(async () => {
  await db.delete(users).where(like(users.email, `${TEST_PREFIX}%`));
});

const fakeUser = {
  id: "u1",
  name: "Dina Pratiwi",
  email: "dina.pratiwi@arsion.app",
  roleNames: ["Admin"],
  permissions: [],
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  requireUserMock.mockReset();
  getCurrentUserMock.mockReset();
});

describe("GET /api/auth/me", () => {
  it("balikin 401 kalau belum login", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
  });

  it("balikin data user kalau udah login", async () => {
    getCurrentUserMock.mockResolvedValue(fakeUser);

    const res = await GET();
    const body = (await res.json()) as { data: { name: string } };

    expect(body.data.name).toBe("Dina Pratiwi");
  });
});

describe("PATCH /api/auth/me", () => {
  it("balikin error dari requireUser kalau belum login", async () => {
    const { NextResponse } = await import("next/server");
    requireUserMock.mockResolvedValue({
      error: NextResponse.json({ message: "Belum login." }, { status: 401 }),
    });

    const res = await PATCH(makeRequest({ name: "Dina Pratiwi", email: "dina@arsion.app" }));

    expect(res.status).toBe(401);
  });

  it("balikin 400 kalau body gak valid", async () => {
    requireUserMock.mockResolvedValue({ user: { ...fakeUser, id: targetUserId } });

    const res = await PATCH(makeRequest({ name: "D", email: "bukan-email" }));

    expect(res.status).toBe(400);
  });

  it("balikin 409 kalau email udah dipakai user LAIN", async () => {
    requireUserMock.mockResolvedValue({ user: { ...fakeUser, id: targetUserId } });

    const res = await PATCH(makeRequest({ name: "Dina Pratiwi", email: otherUserEmail }));

    expect(res.status).toBe(409);
  });

  it("gak nganggep email sendiri (gak ganti) sebagai konflik", async () => {
    requireUserMock.mockResolvedValue({ user: { ...fakeUser, id: targetUserId } });
    getCurrentUserMock.mockResolvedValue({ ...fakeUser, id: targetUserId, name: "Dina P. Updated" });
    const [before] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

    const res = await PATCH(makeRequest({ name: "Dina P. Updated", email: before!.email }));

    expect(res.status).toBe(200);
  });

  it("sukses: update nama/email user yang lagi login di database, balikin data CurrentUser terbaru", async () => {
    requireUserMock.mockResolvedValue({ user: { ...fakeUser, id: targetUserId } });
    getCurrentUserMock.mockResolvedValue({ ...fakeUser, id: targetUserId, name: "Nama Baru" });
    const [before] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);

    const res = await PATCH(makeRequest({ name: "Nama Baru", email: before!.email }));
    const body = (await res.json()) as { data: { name: string } };

    const [after] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    expect(after!.name).toBe("Nama Baru");
    expect(body.data.name).toBe("Nama Baru");
  });
});
