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
import { PATCH as PATCH_PROOF } from "../payment-proof/route";

/** Integration test lawan DB dev asli - lihat memory `prisma-7-slow-query-engine`. */
const requirePermissionMock = vi.mocked(requirePermission);
const TEST_PARTY = "VITEST-PV-PAY-TEST";
const payer = { id: "u1", name: "Kasir Vitest", email: "k@test", roleNames: [], permissions: [PERMISSIONS.PV_PAY] };

async function seedApproved() {
  const [voucher] = await db
    .insert(paymentVouchers)
    .values({
      id: `TESTPAY${Date.now()}${Math.floor(Math.random() * 1000)}`,
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
      paymentMethod: "giro",
      receiverBankName: "",
      receiverAccountName: "",
      receiverAccountNumber: "",
      status: "approved",
      preparedBy: "Pembuat Vitest",
      history: [{ status: "approved", by: "Approver", at: "2026-08-07T00:00:00.000Z" }],
    })
    .returning();
  return voucher!;
}

function patch(handler: typeof PATCH, id: string, body: unknown) {
  return handler(
    new NextRequest(`http://localhost/api/payment-vouchers/${id}/pay`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ id }) }
  );
}

const proofs = [
  { name: "transfer-1.png", urls: ["pv-payment-proof/a.png"] },
  { name: "transfer-2.pdf", urls: ["pv-payment-proof/b-1.png", "pv-payment-proof/b-2.png"] },
];

beforeEach(() => {
  requirePermissionMock.mockReset();
  requirePermissionMock.mockResolvedValue({ user: payer });
});

afterEach(async () => {
  await db.delete(paymentVouchers).where(like(paymentVouchers.partyName, TEST_PARTY));
  await db.delete(notifications).where(like(notifications.description, `%${TEST_PARTY}%`));
  await db.delete(activityLogs).where(like(activityLogs.detail, `%${TEST_PARTY}%`));
});

describe("PATCH /api/payment-vouchers/:id/pay", () => {
  it("400 & status gak berubah kalau belum ada bukti pembayaran", async () => {
    const voucher = await seedApproved();

    const res = await patch(PATCH, voucher.id, { paymentProofs: [] });

    expect(res.status).toBe(400);
    const [row] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));
    expect(row!.status).toBe("approved");
    expect(row!.paidAt).toBeNull();
  });

  it("sukses: simpan banyak bukti, catatan, dan Tanggal Dibayar; kolom lama ikut terisi", async () => {
    const voucher = await seedApproved();
    const before = Date.now();

    const res = await patch(PATCH, voucher.id, { paymentProofs: proofs, paymentNote: "Ref KlikBCA 123" });

    expect(res.status).toBe(200);
    const [row] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));
    expect(row!.status).toBe("paid");
    expect(row!.paidBy).toBe(payer.name);
    expect(row!.paymentNote).toBe("Ref KlikBCA 123");
    expect(row!.paymentProofs).toEqual(proofs);
    expect(row!.paymentProofFileName).toBe("transfer-1.png, transfer-2.pdf");
    expect(row!.paymentProofUrls).toHaveLength(3);
    expect(row!.paidAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });

  it("ganti bukti setelah dibayar gak mengubah Tanggal Dibayar", async () => {
    const voucher = await seedApproved();
    await patch(PATCH, voucher.id, { paymentProofs: proofs });
    const [paid] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));

    const res = await patch(PATCH_PROOF, voucher.id, { paymentProofs: [proofs[0]], paymentNote: "revisi" });

    expect(res.status).toBe(200);
    const [row] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));
    expect(row!.paymentProofs).toEqual([proofs[0]]);
    expect(row!.paymentNote).toBe("revisi");
    expect(row!.paidAt!.getTime()).toBe(paid!.paidAt!.getTime());
  });
});
