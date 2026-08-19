import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers, activityLogs, users } from "@/db/schema";

vi.mock("@/lib/api-auth", () => ({
  requireUser: vi.fn(),
  requirePermission: vi.fn(),
}));

import { requirePermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/config/permissions";
import { POST } from "./route";

const requirePermissionMock = vi.mocked(requirePermission);

const fakeUser = {
  id: "u1",
  name: "Dina Pratiwi",
  email: "dina.pratiwi@arsion.app",
  roleNames: ["Admin"],
  permissions: [PERMISSIONS.PV_VIEW],
};

// Dina Pratiwi asli (seed) dipakai buat cocokin `id` real-nya, biar lookup
// signatureUrl di POST /payment-vouchers (by id, bukan by name) beneran
// nemu row-nya - bukan cuma dites "gak error", tapi "snapshot-nya bener".
let dinaSignatureUrl: string | null = null;

beforeAll(async () => {
  const [dina] = await db.select({ id: users.id, signatureUrl: users.signatureUrl }).from(users).where(eq(users.email, fakeUser.email)).limit(1);
  if (dina) {
    fakeUser.id = dina.id;
    dinaSignatureUrl = dina.signatureUrl;
  }
});

const TEST_PARTY = "VITEST-PV-POST-ROUTE-TEST";

// Tahun "98" (2098) yang gak mungkin ketabrak data asli, biar nomor
// voucher yang dihasilin bisa dipastiin persis (0001) tanpa kepengaruh
// PV lain yang beneran ada di database.
const validBody = {
  direction: "out",
  date: "2098-06-07",
  senderBank: "BRI - Rekening Operasional",
  partyName: TEST_PARTY,
  description: "Test dari vitest",
  items: [{ category: "barang", description: "Item A", qty: 1, unitPrice: 1_000_000 }],
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

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/payment-vouchers", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  requirePermissionMock.mockReset();
});

afterEach(async () => {
  await db.delete(paymentVouchers).where(like(paymentVouchers.partyName, TEST_PARTY));
  await db.delete(activityLogs).where(like(activityLogs.detail, `%${TEST_PARTY}%`));
});

describe("POST /api/payment-vouchers", () => {
  it("balikin error dari requirePermission (403) kalau gak punya izin", async () => {
    const { NextResponse } = await import("next/server");
    requirePermissionMock.mockResolvedValue({
      error: NextResponse.json({ message: "Kamu tidak punya izin untuk aksi ini." }, { status: 403 }),
    });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(403);
  });

  it("cek permission yang dipakai adalah PV_VIEW", async () => {
    requirePermissionMock.mockResolvedValue({ user: fakeUser });

    await POST(makeRequest(validBody));

    expect(requirePermissionMock).toHaveBeenCalledWith(PERMISSIONS.PV_VIEW);
  });

  it("balikin 400 kalau body gak valid (misal partyName kosong)", async () => {
    requirePermissionMock.mockResolvedValue({ user: fakeUser });

    const res = await POST(makeRequest({ ...validBody, partyName: "" }));

    expect(res.status).toBe(400);
    const body = (await res.json()) as { errors: Record<string, string[]> };
    expect(body.errors.partyName).toBeDefined();
  });

  it("payload valid: total dihitung ulang di server (bukan percaya angka dari client), status draft, preparedBy dari user yang login", async () => {
    requirePermissionMock.mockResolvedValue({ user: fakeUser });

    const res = await POST(makeRequest(validBody));
    const body = (await res.json()) as {
      data: {
        status: string;
        preparedBy: string;
        subtotal: number;
        ppnAmount: number;
        totalAmount: number;
        voucherNumber: string;
      };
    };

    expect(res.status).toBe(201);
    expect(body.data.status).toBe("draft");
    expect(body.data.preparedBy).toBe("Dina Pratiwi");
    // 1.000.000 + PPN 11% (110.000) = 1.110.000 - dihitung server-side dari calculatePvTotals asli.
    expect(body.data.subtotal).toBe(1_000_000);
    expect(body.data.ppnAmount).toBe(110_000);
    expect(body.data.totalAmount).toBe(1_110_000);
    expect(body.data.voucherNumber).toBe("9806450001");

    const [log] = await db.select().from(activityLogs).where(like(activityLogs.detail, `%${TEST_PARTY}%`)).limit(1);
    expect(log?.actor).toBe("Dina Pratiwi");
    expect(log?.action).toBe("Buat PV");
  });

  it("preparedSignatureSnapshot disalin dari signatureUrl user yang bikin PV", async () => {
    requirePermissionMock.mockResolvedValue({ user: fakeUser });

    const res = await POST(makeRequest(validBody));
    const body = (await res.json()) as { data: { preparedSignatureSnapshot: string | null } };

    expect(body.data.preparedSignatureSnapshot).toBe(dinaSignatureUrl);
  });

  it("field opsional yang null dari client (receiverBankName dkk kalau PV In) di-default ke string kosong, bukan null, buat kolom yang wajib String", async () => {
    requirePermissionMock.mockResolvedValue({ user: fakeUser });

    const res = await POST(
      makeRequest({
        ...validBody,
        receiverBankName: undefined,
        receiverAccountName: undefined,
        receiverAccountNumber: undefined,
      })
    );
    const body = (await res.json()) as {
      data: { receiverBankName: string; receiverAccountName: string; receiverAccountNumber: string };
    };

    expect(body.data.receiverBankName).toBe("");
    expect(body.data.receiverAccountName).toBe("");
    expect(body.data.receiverAccountNumber).toBe("");
  });
});
