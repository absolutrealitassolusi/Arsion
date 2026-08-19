import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers, users } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requirePermission } from "@/lib/api-auth";
import { PUT } from "./route";

const requirePermissionMock = vi.mocked(requirePermission);

const fakeUser = {
  id: "u1",
  name: "Dina Pratiwi",
  email: "dina.pratiwi@arsion.app",
  roleNames: ["Admin"],
  permissions: [],
};

// Dipakai buat cocokin `fakeUser.id` ke row asli Dina Pratiwi di DB seed,
// biar lookup signatureUrl (by id) di PUT edit beneran nemu row-nya.
let dinaSignatureUrl: string | null = null;

beforeAll(async () => {
  const [dina] = await db.select({ id: users.id, signatureUrl: users.signatureUrl }).from(users).where(eq(users.email, fakeUser.email)).limit(1);
  if (dina) {
    fakeUser.id = dina.id;
    dinaSignatureUrl = dina.signatureUrl;
  }
});

const TEST_PARTY = "VITEST-PV-ID-ROUTE-TEST";

const validBody = {
  direction: "out",
  date: "2026-08-11",
  senderBank: "BRI - Rekening Operasional",
  partyName: "PT Testing Diedit",
  description: "Diedit dari vitest",
  items: [{ category: "barang", description: "Item Baru", qty: 2, unitPrice: 500_000 }],
  ppnPercent: 11,
  pphJasaPercent: 0,
  pphFreelancePercent: 0,
  paymentMethod: "transfer",
  receiverBankName: "BCA",
  receiverAccountName: "PT Testing",
  receiverAccountNumber: "111",
  projectNumber: null,
  poNumber: null,
  invoiceNumber: null,
  taxInvoiceNumber: null,
  attachmentName: null,
  attachmentUrls: null,
};

function makeRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/payment-vouchers/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

// ID voucher yang diseed tiap test - dibersihin lewat ID persis di afterEach
// (bukan pattern-match kaya voucherNumber/partyName), soalnya file test lain
// (mis. transition-payment-voucher.test.ts) pakai prefix "TEST" yang sama
// buat voucherNumber-nya - kalau cleanup di sini pattern-match ke "TEST%",
// pas testnya jalan bareng (paralel), row punya test file LAIN yang lagi
// in-flight ikut kehapus duluan sebelum sempat diassert (race condition,
// sempat beneran kejadian - lihat memory `pv-list-select-star-attachments`).
let seededIds: string[] = [];

async function seedVoucher(overrides: Partial<typeof paymentVouchers.$inferInsert> = {}) {
  const [voucher] = await db
    .insert(paymentVouchers)
    .values({
      voucherNumber: `TEST${Date.now()}${Math.floor(Math.random() * 1000)}`,
      direction: "out",
      date: new Date("2026-08-07"),
      senderBank: "BRI - Rekening Operasional",
      partyName: TEST_PARTY,
      description: "Test",
      items: [{ category: "barang", description: "Item Lama", qty: 1, unitPrice: 100_000 }],
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
  seededIds.push(voucher!.id);
  return voucher!;
}

beforeEach(() => {
  requirePermissionMock.mockReset();
  requirePermissionMock.mockResolvedValue({ user: fakeUser });
  seededIds = [];
});

afterEach(async () => {
  if (seededIds.length === 0) return;
  await db.delete(paymentVouchers).where(inArray(paymentVouchers.id, seededIds));
});

describe("PUT /api/payment-vouchers/[id]", () => {
  it("balikin 404 kalau voucher gak ketemu", async () => {
    const res = await PUT(makeRequest("missing-id-does-not-exist", validBody), {
      params: Promise.resolve({ id: "missing-id-does-not-exist" }),
    });

    expect(res.status).toBe(404);
  });

  it("balikin 400 kalau status BUKAN draft/rejected (misal submitted)", async () => {
    const voucher = await seedVoucher({ status: "submitted" });

    const res = await PUT(makeRequest(voucher.id, validBody), { params: Promise.resolve({ id: voucher.id }) });

    expect(res.status).toBe(400);
  });

  it("balikin 403 kalau yang edit BUKAN pembuat PV-nya", async () => {
    const voucher = await seedVoucher({ status: "draft", preparedBy: "Budi Santoso" });

    const res = await PUT(makeRequest(voucher.id, validBody), { params: Promise.resolve({ id: voucher.id }) });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Cuma pembuat Payment Voucher ini yang bisa mengeditnya.");
  });

  it("balikin 400 kalau body gak valid", async () => {
    const voucher = await seedVoucher({ status: "draft" });

    const res = await PUT(makeRequest(voucher.id, { ...validBody, partyName: "" }), {
      params: Promise.resolve({ id: voucher.id }),
    });

    expect(res.status).toBe(400);
  });

  it("sukses edit dari draft: total dihitung ulang, status tetap draft, history nambah entri baru", async () => {
    const voucher = await seedVoucher({ status: "draft" });

    const res = await PUT(makeRequest(voucher.id, validBody), { params: Promise.resolve({ id: voucher.id }) });

    expect(res.status).toBe(200);
    const [after] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id)).limit(1);
    expect(after!.status).toBe("draft");
    expect(after!.partyName).toBe("PT Testing Diedit");
    // 2 x 500.000 = 1.000.000 + PPN 11% (110.000) = 1.110.000 - dihitung ulang server-side.
    expect(after!.subtotal).toBe(1_000_000);
    expect(after!.totalAmount).toBe(1_110_000);
    expect(after!.history).toHaveLength(2);
    expect(after!.preparedSignatureSnapshot).toBe(dinaSignatureUrl);
    expect(after!.history[1]).toMatchObject({ status: "draft", by: "Dina Pratiwi", note: "PV draft diedit" });
  });

  it("sukses edit dari rejected: status balik jadi draft, history-nya nyatet asal dari rejected", async () => {
    const voucher = await seedVoucher({
      status: "rejected",
      history: [
        { status: "draft", by: "Dina Pratiwi", at: "2026-08-07T00:00:00.000Z" },
        { status: "submitted", by: "Dina Pratiwi", at: "2026-08-08T00:00:00.000Z" },
        { status: "rejected", by: "Budi Santoso", at: "2026-08-09T00:00:00.000Z", note: "Dokumen kurang" },
      ],
    });

    const res = await PUT(makeRequest(voucher.id, validBody), { params: Promise.resolve({ id: voucher.id }) });

    expect(res.status).toBe(200);
    const [after] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id)).limit(1);
    expect(after!.status).toBe("draft");
    expect(after!.history).toHaveLength(4);
    expect(after!.history[3]).toMatchObject({
      status: "draft",
      by: "Dina Pratiwi",
      note: "PV yang ditolak diedit & disimpan ulang sebagai Draft",
    });
  });
});
