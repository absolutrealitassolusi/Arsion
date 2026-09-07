import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers, notifications, activityLogs, users } from "@/db/schema";
import { transitionPaymentVoucher } from "./transition-payment-voucher";

/** Integration test lawan DB dev asli - lihat memory `prisma-7-slow-query-engine`. */
const TEST_PARTY = "VITEST-TRANSITION-TEST";

// Dina Pratiwi (seed) dipakai sebagai `by` di beberapa test transisi -
// signatureUrl asli-nya dipakai buat assert snapshot approve/pay bener-bener
// nyalin dari user yang bersangkutan, bukan cuma "ada isinya".
let dinaSignatureUrl: string | null = null;

beforeAll(async () => {
  const [dina] = await db.select({ signatureUrl: users.signatureUrl }).from(users).where(eq(users.name, "Dina Pratiwi")).limit(1);
  dinaSignatureUrl = dina?.signatureUrl ?? null;
});

async function seedVoucher(overrides: Partial<typeof paymentVouchers.$inferInsert> = {}) {
  const [voucher] = await db
    .insert(paymentVouchers)
    .values({
      id: `TEST${Date.now()}${Math.floor(Math.random() * 1000)}`,
      direction: "out",
      date: new Date("2026-08-07"),
      senderBank: "BRI - Rekening Operasional",
      partyName: TEST_PARTY,
      description: "Test",
      items: [{ category: "barang", description: "Item", qty: 1, unitPrice: 100_000 }],
      ppnPercent: 11,
      pphJasaPercent: 0,
      pphFreelancePercent: 0,
      subtotal: 100_000,
      ppnAmount: 11_000,
      pphJasaAmount: 0,
      pphFreelanceAmount: 0,
      totalAmount: 111_000,
      paymentMethod: "transfer",
      receiverBankName: "BRI",
      receiverAccountName: "PT Testing",
      receiverAccountNumber: "123",
      status: "draft",
      preparedBy: "Dina Pratiwi",
      history: [{ status: "draft", by: "Dina Pratiwi", at: "2026-08-07T00:00:00.000Z" }],
      ...overrides,
    })
    .returning();
  return voucher!;
}

beforeEach(async () => {
  await db.delete(notifications).where(like(notifications.description, `%${TEST_PARTY}%`));
});

afterEach(async () => {
  await db.delete(paymentVouchers).where(like(paymentVouchers.partyName, TEST_PARTY));
  await db.delete(notifications).where(like(notifications.description, `%${TEST_PARTY}%`));
  await db.delete(activityLogs).where(like(activityLogs.detail, `%${TEST_PARTY}%`));
});

describe("transitionPaymentVoucher", () => {
  it("balikin 404 kalau voucher gak ketemu", async () => {
    const res = await transitionPaymentVoucher(
      "missing-id-that-does-not-exist",
      "draft",
      "submitted",
      "err",
      "Dina Pratiwi"
    );

    expect(res.status).toBe(404);
  });

  it("balikin 400 & GAK update kalau status sekarang beda dari yang disyaratkan", async () => {
    const voucher = await seedVoucher({ status: "approved" });

    const res = await transitionPaymentVoucher(
      voucher.id,
      "draft",
      "submitted",
      "Hanya Payment Voucher berstatus Draft yang bisa diajukan.",
      "Dina Pratiwi"
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Hanya Payment Voucher berstatus Draft yang bisa diajukan.");
    const [after] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id)).limit(1);
    expect(after!.status).toBe("approved");
  });

  it("submit sukses: history nambah entri baru, notifikasi 'diajukan' dibuat", async () => {
    const voucher = await seedVoucher({ status: "draft" });

    const res = await transitionPaymentVoucher(voucher.id, "draft", "submitted", "err", "Dina Pratiwi");

    expect(res.status).toBe(200);
    const [after] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id)).limit(1);
    expect(after!.status).toBe("submitted");
    expect(after!.history).toHaveLength(2);
    expect(after!.history[1]).toMatchObject({ status: "submitted", by: "Dina Pratiwi" });

    const [notif] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.description, `${voucher.id} (${TEST_PARTY}) menunggu approval.`))
      .limit(1);
    expect(notif).toBeDefined();
    expect(notif!.title).toBe("Payment Voucher diajukan");
    expect(notif!.type).toBe("info");
  });

  it("approve sukses: field extra (approvedBy) ikut ke-merge ke data update", async () => {
    const voucher = await seedVoucher({ status: "submitted" });

    const res = await transitionPaymentVoucher(voucher.id, "submitted", "approved", "err", "Dina Pratiwi", {
      approvedBy: "Dina Pratiwi",
    });

    expect(res.status).toBe(200);
    const [after] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id)).limit(1);
    expect(after!.approvedBy).toBe("Dina Pratiwi");
    expect(after!.status).toBe("approved");
    expect(after!.approvedSignatureSnapshot).toBe(dinaSignatureUrl);

    const [log] = await db.select().from(activityLogs).where(like(activityLogs.detail, `%${TEST_PARTY}%`)).limit(1);
    expect(log?.actor).toBe("Dina Pratiwi");
    expect(log?.action).toBe("Approve PV");
  });

  it("reject sukses: catatan penolakan ikut masuk ke history entry & ke notifikasi", async () => {
    const voucher = await seedVoucher({ status: "submitted" });

    const res = await transitionPaymentVoucher(
      voucher.id,
      "submitted",
      "rejected",
      "err",
      "Dina Pratiwi",
      undefined,
      "Dokumen kurang lengkap"
    );

    expect(res.status).toBe(200);
    const [after] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id)).limit(1);
    expect(after!.history[1]).toMatchObject({
      status: "rejected",
      by: "Dina Pratiwi",
      note: "Dokumen kurang lengkap",
    });

    const [notif] = await db
      .select()
      .from(notifications)
      .where(
        eq(
          notifications.description,
          `${voucher.id} (${TEST_PARTY}) ditolak oleh Dina Pratiwi - Dokumen kurang lengkap.`
        )
      )
      .limit(1);
    expect(notif).toBeDefined();
    expect(notif!.type).toBe("warning");
  });

  it("pay sukses: field extra (paidBy) ke-merge, notifikasi 'dibayar' dibuat", async () => {
    const voucher = await seedVoucher({ status: "approved" });

    const res = await transitionPaymentVoucher(voucher.id, "approved", "paid", "err", "Dina Pratiwi", {
      paidBy: "Dina Pratiwi",
    });

    expect(res.status).toBe(200);
    const [after] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id)).limit(1);
    expect(after!.status).toBe("paid");
    expect(after!.paidBy).toBe("Dina Pratiwi");
    expect(after!.paidSignatureSnapshot).toBe(dinaSignatureUrl);

    const [notif] = await db
      .select()
      .from(notifications)
      .where(
        eq(notifications.description, `${voucher.id} (${TEST_PARTY}) ditandai sudah dibayar oleh Dina Pratiwi.`)
      )
      .limit(1);
    expect(notif).toBeDefined();
    expect(notif!.type).toBe("success");
  });

  it("preparedBy sama dengan `by` (self-approve): tetap sukses, gak ada guard segregation-of-duties lagi", async () => {
    const voucher = await seedVoucher({ status: "submitted", preparedBy: "Dina Pratiwi" });

    const res = await transitionPaymentVoucher(voucher.id, "submitted", "approved", "err", "Dina Pratiwi", {
      approvedBy: "Dina Pratiwi",
    });

    expect(res.status).toBe(200);
    const [after] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id)).limit(1);
    expect(after!.status).toBe("approved");
    expect(after!.approvedBy).toBe("Dina Pratiwi");
  });
});
