import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
}));

import { requireUser } from "@/lib/api-auth";
import { GET } from "./route";

const requireUserMock = vi.mocked(requireUser);

const fakeUser = { id: "u1", name: "Dina Pratiwi", email: "dina@arsion.app", roleNames: ["Admin"], permissions: [] };

const TEST_ACTOR = "VITEST-ACTIVITY-LOG-TEST";

function makeRequest(query = "") {
  return new NextRequest(`http://localhost/api/activity-logs${query}`);
}

beforeEach(() => {
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ user: fakeUser });
});

afterEach(async () => {
  await db.delete(activityLogs).where(like(activityLogs.actor, `${TEST_ACTOR}%`));
});

describe("GET /api/activity-logs", () => {
  it("balikin 401 kalau belum login", async () => {
    const { NextResponse } = await import("next/server");
    requireUserMock.mockResolvedValue({ error: NextResponse.json({ message: "Belum login." }, { status: 401 }) });

    const res = await GET(makeRequest());

    expect(res.status).toBe(401);
  });

  it("balikin log terbaru duluan (desc by createdAt)", async () => {
    // Insert terpisah (bukan 1 batch) + createdAt eksplisit beda - `now()`
    // Postgres balikin nilai sama buat seluruh 1 statement/transaksi, jadi
    // 2 baris dalam 1 insert batch bisa punya createdAt identik dan urutan
    // DESC-nya jadi gak pasti.
    const earlier = new Date(Date.now() - 5000);
    const later = new Date();
    await db.insert(activityLogs).values({ actor: TEST_ACTOR, action: "Tambah Vendor", detail: "Vendor A", createdAt: earlier });
    await db.insert(activityLogs).values({ actor: TEST_ACTOR, action: "Edit Vendor", detail: "Vendor A", createdAt: later });

    const res = await GET(makeRequest());
    const body = (await res.json()) as { data: { actor: string; action: string }[] };

    const mine = body.data.filter((l) => l.actor === TEST_ACTOR);
    expect(mine).toHaveLength(2);
    expect(mine[0]!.action).toBe("Edit Vendor");
    expect(mine[1]!.action).toBe("Tambah Vendor");
  });

  it("filter ?actor= cuma balikin log punya actor itu", async () => {
    await db.insert(activityLogs).values([
      { actor: `${TEST_ACTOR}-A`, action: "Login", detail: "Masuk ke sistem" },
      { actor: `${TEST_ACTOR}-B`, action: "Login", detail: "Masuk ke sistem" },
    ]);

    const res = await GET(makeRequest(`?actor=${TEST_ACTOR}-A`));
    const body = (await res.json()) as { data: { actor: string }[] };

    expect(body.data.every((l) => l.actor === `${TEST_ACTOR}-A`)).toBe(true);
    expect(body.data.some((l) => l.actor === `${TEST_ACTOR}-B`)).toBe(false);
  });
});
