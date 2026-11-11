import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requireUser } from "@/lib/api-auth";
import { GET } from "./route";
import type { PaymentVoucher } from "@/types/payment-voucher";

/** Integration test lawan DB dev asli. */
const requireUserMock = vi.mocked(requireUser);
const TEST_PARTY = "VITEST-PV-LIST-TEST";
const file = (name: string) => ({ name, urls: [`pv-attachment/${name}`] });

async function seed(values: Partial<typeof paymentVouchers.$inferInsert>) {
  const [voucher] = await db
    .insert(paymentVouchers)
    .values({
      id: `TESTLIST${Date.now()}${Math.floor(Math.random() * 100000)}`,
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
      status: "paid",
      preparedBy: "Vitest",
      history: [],
      ...values,
    })
    .returning();
  return voucher!;
}

async function list(search: string) {
  const res = await GET(new NextRequest(`http://localhost/api/payment-vouchers?search=${encodeURIComponent(search)}`));
  expect(res.status).toBe(200);
  return ((await res.json()) as { data: PaymentVoucher[] }).data;
}

beforeEach(() => {
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ user: { id: "u1", name: "Vitest", email: "v@test", roleNames: [], permissions: [] } });
});

afterEach(async () => {
  await db.delete(paymentVouchers).where(like(paymentVouchers.partyName, TEST_PARTY));
});

describe("GET /api/payment-vouchers", () => {
  it("pencarian ikut mencocokkan Keterangan", async () => {
    const voucher = await seed({ description: "Pelunasan invoice #VITEST-INV-9911" });
    const rows = await list("vitest-inv-9911");
    expect(rows.map((r) => r.id)).toEqual([voucher.id]);
  });

  it("documentCount = lampiran + bukti bayar + Faktur + Bupot", async () => {
    const voucher = await seed({
      attachments: [file("a.png"), file("b.png")],
      paymentProofs: [file("tf.png")],
      taxProofs: [file("faktur.png")],
      withholdingProofs: [file("bupot-1.png"), file("bupot-2.png")],
    });
    const [row] = (await list(TEST_PARTY)).filter((r) => r.id === voucher.id);
    expect(row!.documentCount).toBe(6);
  });

  it("documentCount PV lama: tiap kolom lama yang terisi dihitung 1", async () => {
    const voucher = await seed({
      attachmentName: "lama.png",
      attachmentUrls: ["x"],
      paymentProofFileName: "tf-lama.png",
      paymentProofUrls: ["y"],
    });
    const [row] = (await list(TEST_PARTY)).filter((r) => r.id === voucher.id);
    expect(row!.documentCount).toBe(2);
  });
});
