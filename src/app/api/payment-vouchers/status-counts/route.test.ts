import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requireUser } from "@/lib/api-auth";
import { GET } from "./route";

/** Integration test lawan DB dev asli - dibandingkan selisihnya, karena data lain di DB ikut terhitung. */
const requireUserMock = vi.mocked(requireUser);
const TEST_PARTY = "VITEST-PV-COUNTS-TEST";

async function seed(status: "submitted" | "approved" | "draft") {
  await db.insert(paymentVouchers).values({
    id: `TESTCNT${Date.now()}${Math.floor(Math.random() * 100000)}`,
    direction: "out",
    date: new Date("2026-08-07"),
    senderBank: "Bank BRI",
    partyName: TEST_PARTY,
    description: "Test",
    items: [],
    ppnPercent: 0,
    pphJasaPercent: 0,
    pphFreelancePercent: 0,
    subtotal: 0,
    ppnAmount: 0,
    pphJasaAmount: 0,
    pphFreelanceAmount: 0,
    totalAmount: 0,
    paymentMethod: "transfer",
    receiverBankName: "",
    receiverAccountName: "",
    receiverAccountNumber: "",
    status,
    preparedBy: "Vitest",
    history: [],
  });
}

async function getCounts() {
  const res = await GET();
  expect(res.status).toBe(200);
  return ((await res.json()) as { data: { submitted: number; approved: number } }).data;
}

beforeEach(() => {
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ user: { id: "u1", name: "Vitest", email: "v@test", roleNames: [], permissions: [] } });
});

afterEach(async () => {
  await db.delete(paymentVouchers).where(like(paymentVouchers.partyName, TEST_PARTY));
});

describe("GET /api/payment-vouchers/status-counts", () => {
  it("menghitung PV submitted & approved, status lain diabaikan", async () => {
    const before = await getCounts();

    await seed("submitted");
    await seed("submitted");
    await seed("approved");
    await seed("draft");

    const after = await getCounts();
    expect(after.submitted - before.submitted).toBe(2);
    expect(after.approved - before.approved).toBe(1);
  });
});
