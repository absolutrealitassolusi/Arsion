import { afterEach, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers } from "@/db/schema";
import { nextVoucherNumber } from "./pv-voucher-number";

/**
 * Integration test lawan DB dev asli - lihat memory `prisma-7-slow-query-engine`.
 * Pakai tahun "99" (2099) yang gak mungkin ketabrak data asli, biar bebas
 * insert/hapus tanpa resiko ke data PV yang beneran dipakai.
 */
const TEST_PARTY = "VITEST-VOUCHER-NUMBER-TEST";

async function seedVoucherNumbers(voucherNumbers: string[]) {
  if (voucherNumbers.length === 0) return;
  await db.insert(paymentVouchers).values(
    voucherNumbers.map((voucherNumber) => ({
      voucherNumber,
      direction: "out" as const,
      date: new Date("2099-07-25"),
      senderBank: "Test",
      partyName: TEST_PARTY,
      description: "Test",
      items: [{ category: "barang" as const, description: "Item", qty: 1, unitPrice: 1000 }],
      ppnPercent: 0,
      pphJasaPercent: 0,
      pphFreelancePercent: 0,
      subtotal: 1000,
      ppnAmount: 0,
      pphJasaAmount: 0,
      pphFreelanceAmount: 0,
      totalAmount: 1000,
      paymentMethod: "transfer" as const,
      receiverBankName: "",
      receiverAccountName: "",
      receiverAccountNumber: "",
      preparedBy: "Vitest",
      history: [{ status: "draft" as const, by: "Vitest", at: new Date().toISOString() }],
    }))
  );
}

afterEach(async () => {
  await db.delete(paymentVouchers).where(like(paymentVouchers.partyName, TEST_PARTY));
});

describe("nextVoucherNumber", () => {
  it("mulai dari 0001 kalau belum ada nomor di periode itu", async () => {
    const result = await db.transaction((tx) => nextVoucherNumber(tx, "2099-07-25"));
    expect(result).toBe("9907450001");
  });

  it("lanjut +1 dari nomor terbesar yang sudah ada di periode yang sama", async () => {
    await seedVoucherNumbers(["9907450001", "9907450002", "9907450003"]);

    const result = await db.transaction((tx) => nextVoucherNumber(tx, "2099-07-28"));

    expect(result).toBe("9907450004");
  });

  it("gak kepengaruh urutan datanya - tetap ambil yang PALING BESAR", async () => {
    await seedVoucherNumbers(["9907450003", "9907450001", "9907450002"]);

    const result = await db.transaction((tx) => nextVoucherNumber(tx, "2099-07-01"));

    expect(result).toBe("9907450004");
  });

  it("YY/MM ikut tanggal PV, bukan tanggal lain", async () => {
    await expect(db.transaction((tx) => nextVoucherNumber(tx, "2099-01-05"))).resolves.toBe("9901450001");
    await expect(db.transaction((tx) => nextVoucherNumber(tx, "2099-12-31"))).resolves.toBe("9912450001");
  });
});
