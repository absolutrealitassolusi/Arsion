import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers, notifications, activityLogs } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requirePermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/config/permissions";
import { PATCH } from "./route";

/** Integration test lawan DB dev asli. */
const requirePermissionMock = vi.mocked(requirePermission);
const TEST_PARTY = "VITEST-PV-REJECT-TEST";
const approver = { id: "u1", name: "Approver Vitest", email: "a@test", roleNames: [], permissions: [PERMISSIONS.PV_APPROVE] };

async function seedSubmitted() {
  const [voucher] = await db
    .insert(paymentVouchers)
    .values({
      id: `TESTREJ${Date.now()}${Math.floor(Math.random() * 1000)}`,
      direction: "out",
      date: new Date("2026-08-07"),
      senderBank: "Bank BRI",
      partyName: TEST_PARTY,
      description: "Test",
      items: [{ category: "barang", description: "Item", qty: 1, unitPrice: 100_000 }],
      ppnPercent: 0,
      pphJasaPercent: 0,
      pphFreelancePercent: 0,
      subtotal: 100_000,
      ppnAmount: 0,
      pphJasaAmount: 0,
      pphFreelanceAmount: 0,
      totalAmount: 100_000,
      paymentMethod: "transfer",
      receiverBankName: "",
      receiverAccountName: "",
      receiverAccountNumber: "",
      status: "submitted",
      preparedBy: "Pembuat Vitest",
      history: [{ status: "submitted", by: "Pembuat Vitest", at: "2026-08-07T00:00:00.000Z" }],
    })
    .returning();
  return voucher!;
}

function patch(id: string, body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/payment-vouchers/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ id }) }
  );
}

beforeEach(() => {
  requirePermissionMock.mockReset();
  requirePermissionMock.mockResolvedValue({ user: approver });
});

afterEach(async () => {
  await db.delete(paymentVouchers).where(like(paymentVouchers.partyName, TEST_PARTY));
  await db.delete(notifications).where(like(notifications.description, `%${TEST_PARTY}%`));
  await db.delete(activityLogs).where(like(activityLogs.detail, `%${TEST_PARTY}%`));
});

describe("PATCH /api/payment-vouchers/:id/reject", () => {
  it.each([{}, { note: "" }, { note: "   " }])("400 & status gak berubah kalau alasan kosong (%j)", async (body) => {
    const voucher = await seedSubmitted();

    const res = await patch(voucher.id, body);

    expect(res.status).toBe(400);
    const [row] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));
    expect(row!.status).toBe("submitted");
  });

  it("sukses: status jadi rejected dan alasan (di-trim) tersimpan di history", async () => {
    const voucher = await seedSubmitted();

    const res = await patch(voucher.id, { note: "  Invoice belum dilampirkan  " });

    expect(res.status).toBe(200);
    const [row] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));
    expect(row!.status).toBe("rejected");
    expect(row!.history.at(-1)).toMatchObject({ status: "rejected", by: approver.name, note: "Invoice belum dilampirkan" });
  });
});
