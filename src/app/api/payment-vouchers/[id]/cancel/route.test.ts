import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers, notifications, activityLogs } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requireUser } from "@/lib/api-auth";
import { PERMISSIONS } from "@/config/permissions";
import type { PvStatus } from "@/types/payment-voucher";
import { PATCH } from "./route";

/** Integration test lawan DB dev asli - lihat memory `prisma-7-slow-query-engine`. */
const requireUserMock = vi.mocked(requireUser);
const TEST_PARTY = "VITEST-PV-CANCEL-TEST";

const preparer = { id: "u1", name: "Pembuat Vitest", email: "a@test", roleNames: [], permissions: [PERMISSIONS.PV_VIEW] };
const approver = {
  id: "u2",
  name: "Approver Vitest",
  email: "b@test",
  roleNames: [],
  permissions: [PERMISSIONS.PV_VIEW, PERMISSIONS.PV_APPROVE],
};
const otherStaff = { id: "u3", name: "Staff Lain Vitest", email: "c@test", roleNames: [], permissions: [PERMISSIONS.PV_VIEW] };

async function seedVoucher(status: PvStatus) {
  const [voucher] = await db
    .insert(paymentVouchers)
    .values({
      id: `TESTCANCEL${Date.now()}${Math.floor(Math.random() * 1000)}`,
      direction: "out",
      date: new Date("2026-08-07"),
      senderBank: "BRI",
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
      status,
      preparedBy: preparer.name,
      history: [{ status: "draft", by: preparer.name, at: "2026-08-07T00:00:00.000Z" }],
    })
    .returning();
  return voucher!;
}

function cancel(id: string, body: unknown = { note: "PV dobel" }) {
  return PATCH(
    new NextRequest(`http://localhost/api/payment-vouchers/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ id }) }
  );
}

beforeEach(() => {
  requireUserMock.mockReset();
});

afterEach(async () => {
  await db.delete(paymentVouchers).where(like(paymentVouchers.partyName, TEST_PARTY));
  await db.delete(notifications).where(like(notifications.description, `%${TEST_PARTY}%`));
  await db.delete(activityLogs).where(like(activityLogs.detail, `%${TEST_PARTY}%`));
});

describe("PATCH /api/payment-vouchers/:id/cancel", () => {
  it("pembuat PV bisa membatalkan PV yang menunggu approval - alasan masuk history, notifikasi & log dibuat", async () => {
    requireUserMock.mockResolvedValue({ user: preparer });
    const voucher = await seedVoucher("submitted");

    const res = await cancel(voucher.id);

    expect(res.status).toBe(200);
    const [row] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));
    expect(row!.status).toBe("cancelled");
    expect(row!.history.at(-1)).toMatchObject({ status: "cancelled", by: preparer.name, note: "PV dobel" });

    const [notif] = await db.select().from(notifications).where(like(notifications.description, `%${voucher.id}%`));
    expect(notif?.title).toBe("Payment Voucher dibatalkan");
    const [log] = await db.select().from(activityLogs).where(like(activityLogs.detail, `%${voucher.id}%`));
    expect(log?.action).toBe("Batalkan PV");
  });

  it("approver bisa membatalkan PV yang sudah disetujui walau bukan pembuatnya", async () => {
    requireUserMock.mockResolvedValue({ user: approver });
    const voucher = await seedVoucher("approved");

    const res = await cancel(voucher.id);

    expect(res.status).toBe(200);
  });

  it("403 kalau bukan pembuat dan gak punya izin Approve", async () => {
    requireUserMock.mockResolvedValue({ user: otherStaff });
    const voucher = await seedVoucher("submitted");

    const res = await cancel(voucher.id);

    expect(res.status).toBe(403);
    const [row] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));
    expect(row!.status).toBe("submitted");
  });

  it("400 kalau alasan kosong", async () => {
    requireUserMock.mockResolvedValue({ user: preparer });
    const voucher = await seedVoucher("submitted");

    const res = await cancel(voucher.id, { note: "   " });

    expect(res.status).toBe(400);
  });

  it("400 kalau PV sudah dibayar atau sudah dibatalkan", async () => {
    requireUserMock.mockResolvedValue({ user: approver });
    const paid = await seedVoucher("paid");
    const cancelled = await seedVoucher("cancelled");

    expect((await cancel(paid.id)).status).toBe(400);
    expect((await cancel(cancelled.id)).status).toBe(400);
  });

  it("404 kalau PV gak ada", async () => {
    requireUserMock.mockResolvedValue({ user: preparer });

    expect((await cancel("TIDAK-ADA-PV-INI")).status).toBe(404);
  });
});
