import { afterEach, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentVouchers, pvCounters } from "@/db/schema";
import {
  DEFAULT_PV_NUMBERING,
  formatVoucherNumber,
  nextVoucherNumber,
  peekVoucherNumber,
  periodKeyFor,
} from "./pv-voucher-number";

/**
 * Integration test lawan DB dev asli - lihat memory `prisma-7-slow-query-engine`.
 * Pakai tahun "99" (2099) yang gak mungkin ketabrak data asli, biar bebas
 * insert/hapus tanpa resiko ke data PV yang beneran dipakai. Asumsi: setting
 * penomoran di Company masih default (kode 45, 4 digit, reset bulanan).
 */
const TEST_PARTY = "VITEST-VOUCHER-NUMBER-TEST";

async function seedVoucherNumbers(voucherNumbers: string[]) {
  if (voucherNumbers.length === 0) return;
  await db.insert(paymentVouchers).values(
    voucherNumbers.map((voucherNumber) => ({
      id: voucherNumber,
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
  await db.delete(pvCounters).where(like(pvCounters.period, "99%"));
});

describe("periodKeyFor & formatVoucherNumber", () => {
  it("kunci periode ikut mode reset", () => {
    expect(periodKeyFor("2026-11-10", "monthly")).toBe("2611");
    expect(periodKeyFor("2026-11-10", "yearly")).toBe("26");
    expect(periodKeyFor("2026-11-10", "never")).toBe("all");
  });

  it("format YYMM + kode + nomor urut sepanjang seqLength", () => {
    expect(formatVoucherNumber("2026-11-10", DEFAULT_PV_NUMBERING, 7)).toBe("2611450007");
    expect(formatVoucherNumber("2026-11-10", { code: "12", seqLength: 5, resetMode: "yearly" }, 7)).toBe("26111200007");
  });
});

describe("nextVoucherNumber", () => {
  it("mulai dari 0001 kalau belum ada nomor di periode itu", async () => {
    const result = await db.transaction((tx) => nextVoucherNumber(tx, "2099-07-25"));
    expect(result).toBe("9907450001");
  });

  it("lanjut dari nomor terbesar PV lama yang sudah ada (data dari sebelum ada tabel counter)", async () => {
    await seedVoucherNumbers(["9907450003", "9907450001", "9907450002"]);

    const result = await db.transaction((tx) => nextVoucherNumber(tx, "2099-07-28"));

    expect(result).toBe("9907450004");
  });

  it("counter terus naik walau PV-nya dihapus / gak disimpan (nomor gak dipakai ulang)", async () => {
    const first = await db.transaction((tx) => nextVoucherNumber(tx, "2099-07-01"));
    const second = await db.transaction((tx) => nextVoucherNumber(tx, "2099-07-02"));

    expect(first).toBe("9907450001");
    expect(second).toBe("9907450002");
  });

  it("counter ikut di-rollback kalau transaksinya gagal", async () => {
    await expect(
      db.transaction(async (tx) => {
        await nextVoucherNumber(tx, "2099-07-01");
        throw new Error("insert PV gagal");
      })
    ).rejects.toThrow("insert PV gagal");

    await expect(db.transaction((tx) => nextVoucherNumber(tx, "2099-07-01"))).resolves.toBe("9907450001");
  });

  it("YY/MM ikut tanggal PV, bukan tanggal lain", async () => {
    await expect(db.transaction((tx) => nextVoucherNumber(tx, "2099-01-05"))).resolves.toBe("9901450001");
    await expect(db.transaction((tx) => nextVoucherNumber(tx, "2099-12-31"))).resolves.toBe("9912450001");
  });
});

describe("peekVoucherNumber", () => {
  it("nunjukin nomor berikutnya tanpa menaikkan counter", async () => {
    await db.transaction((tx) => nextVoucherNumber(tx, "2099-07-01"));

    await expect(peekVoucherNumber(db, "2099-07-15")).resolves.toBe("9907450002");
    await expect(peekVoucherNumber(db, "2099-07-15")).resolves.toBe("9907450002");
  });
});
