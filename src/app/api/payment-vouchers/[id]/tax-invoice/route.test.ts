import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requirePermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/config/permissions";
import { serializePaymentVoucher } from "@/lib/serialize-payment-voucher";
import { PATCH } from "./route";

/** Integration test lawan DB dev asli. */
const requirePermissionMock = vi.mocked(requirePermission);
const TEST_PARTY = "VITEST-PV-TAX-TEST";
const payer = { id: "u1", name: "Kasir Vitest", email: "k@test", roleNames: [], permissions: [PERMISSIONS.PV_PAY] };

async function seed(status: "paid" | "approved", legacy?: { name: string; urls: string[] }) {
  const [voucher] = await db
    .insert(paymentVouchers)
    .values({
      id: `TESTTAX${Date.now()}${Math.floor(Math.random() * 1000)}`,
      direction: "out",
      date: new Date("2026-08-07"),
      senderBank: "Bank BRI",
      partyName: TEST_PARTY,
      description: "Test",
      items: [{ category: "jasa", description: "Jasa", qty: 1, unitPrice: 1_000_000 }],
      ppnPercent: 11,
      pphJasaPercent: 2,
      pphFreelancePercent: 0,
      subtotal: 1_000_000,
      ppnAmount: 110_000,
      pphJasaAmount: 20_000,
      pphFreelanceAmount: 0,
      totalAmount: 1_090_000,
      paymentMethod: "transfer",
      receiverBankName: "",
      receiverAccountName: "",
      receiverAccountNumber: "",
      status,
      preparedBy: "Pembuat Vitest",
      history: [],
      ...(legacy ? { taxProofFileName: legacy.name, taxProofUrls: legacy.urls } : {}),
    })
    .returning();
  return voucher!;
}

function patch(id: string, body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/payment-vouchers/${id}/tax-invoice`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    { params: Promise.resolve({ id }) }
  );
}

const faktur = [{ name: "faktur.pdf", urls: ["pv-tax-proof/f-1.png"] }];
const bupot = [
  { name: "bupot-1.pdf", urls: ["pv-tax-proof/b-1.png", "pv-tax-proof/b-2.png"] },
  { name: "bupot-2.png", urls: ["pv-tax-proof/c.png"] },
];

beforeEach(() => {
  requirePermissionMock.mockReset();
  requirePermissionMock.mockResolvedValue({ user: payer });
});

afterEach(async () => {
  await db.delete(paymentVouchers).where(like(paymentVouchers.partyName, TEST_PARTY));
});

describe("PATCH /api/payment-vouchers/:id/tax-invoice", () => {
  it("400 kalau PV belum dibayar", async () => {
    const voucher = await seed("approved");
    const res = await patch(voucher.id, { taxInvoiceNumber: "010.000-26.1" });
    expect(res.status).toBe(400);
  });

  it("400 kalau format file tidak valid", async () => {
    const voucher = await seed("paid");
    const res = await patch(voucher.id, { withholdingProofs: [{ name: "", urls: [] }] });
    expect(res.status).toBe(400);
  });

  it("simpan Faktur & Bukti Potong terpisah; kolom lama berisi gabungannya", async () => {
    const voucher = await seed("paid");

    const res = await patch(voucher.id, {
      taxInvoiceNumber: "  010.000-26.00000001  ",
      taxProofs: faktur,
      withholdingProofs: bupot,
      taxNote: "Bupot dikirim ke vendor via email",
    });

    expect(res.status).toBe(200);
    const [row] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));
    expect(row!.taxInvoiceNumber).toBe("010.000-26.00000001");
    expect(row!.taxProofs).toEqual(faktur);
    expect(row!.withholdingProofs).toEqual(bupot);
    expect(row!.taxNote).toBe("Bupot dikirim ke vendor via email");
    expect(row!.taxProofFileName).toBe("faktur.pdf, bupot-1.pdf, bupot-2.png");
    expect(row!.taxProofUrls).toHaveLength(4);

    // Kolom lama gak boleh dibaca balik jadi file Faktur setelah dipisah.
    const serialized = serializePaymentVoucher(row!);
    expect(serialized.taxProofs).toEqual(faktur);
    expect(serialized.withholdingProofs).toEqual(bupot);
  });

  it("nomor Faktur & catatan kosong disimpan sebagai null", async () => {
    const voucher = await seed("paid");
    const res = await patch(voucher.id, { taxInvoiceNumber: "   ", taxNote: "", withholdingProofs: bupot });
    expect(res.status).toBe(200);
    const [row] = await db.select().from(paymentVouchers).where(eq(paymentVouchers.id, voucher.id));
    expect(row!.taxInvoiceNumber).toBeNull();
    expect(row!.taxNote).toBeNull();
    expect(row!.taxProofs).toEqual([]);
  });

  it("PV lama: Bukti Pajak di kolom lama dibaca sebagai file Faktur", async () => {
    const voucher = await seed("paid", { name: "bukti-lama.png", urls: ["pv-tax-proof/old.png"] });
    const serialized = serializePaymentVoucher(voucher);
    expect(serialized.taxProofs).toEqual([{ name: "bukti-lama.png", urls: ["pv-tax-proof/old.png"] }]);
    expect(serialized.withholdingProofs).toEqual([]);
  });
});
