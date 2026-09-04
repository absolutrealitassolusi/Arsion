import { afterEach, describe, expect, it } from "vitest";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "@/db/schema";
import { nextInvoiceNumber } from "./next-invoice-number";

/**
 * Integration test lawan DB dev asli - sama pola-nya kaya
 * pv-voucher-number.test.ts. Pakai tahun "99" (2099) yang gak mungkin
 * ketabrak data asli, biar bebas insert/hapus tanpa resiko ke data invoice
 * yang beneran dipakai.
 */
const TEST_CUSTOMER = "VITEST-INVOICE-NUMBER-TEST";

async function seedInvoiceNumbers(invoiceNumbers: string[]) {
  if (invoiceNumbers.length === 0) return;
  await db.insert(invoices).values(
    invoiceNumbers.map((invoiceNumber) => ({
      invoiceNumber,
      customerName: TEST_CUSTOMER,
      date: new Date("2099-07-25"),
      dueDate: new Date("2099-08-25"),
      items: [{ description: "Item", qty: 1, unitPrice: 1000 }],
      ppnPercent: 0,
      subtotal: 1000,
      ppnAmount: 0,
      totalAmount: 1000,
      preparedBy: "Vitest",
      history: [{ status: "draft" as const, by: "Vitest", at: new Date().toISOString() }],
    }))
  );
}

afterEach(async () => {
  await db.delete(invoices).where(like(invoices.customerName, TEST_CUSTOMER));
});

describe("nextInvoiceNumber", () => {
  it("mulai dari 0001 kalau belum ada nomor di periode itu", async () => {
    const result = await db.transaction((tx) => nextInvoiceNumber(tx, "2099-07-25"));
    expect(result).toBe("INV/9907/0001");
  });

  it("lanjut +1 dari nomor terbesar yang sudah ada di periode yang sama", async () => {
    await seedInvoiceNumbers(["INV/9907/0001", "INV/9907/0002", "INV/9907/0003"]);

    const result = await db.transaction((tx) => nextInvoiceNumber(tx, "2099-07-28"));

    expect(result).toBe("INV/9907/0004");
  });

  it("gak kepengaruh urutan datanya - tetap ambil yang PALING BESAR", async () => {
    await seedInvoiceNumbers(["INV/9907/0003", "INV/9907/0001", "INV/9907/0002"]);

    const result = await db.transaction((tx) => nextInvoiceNumber(tx, "2099-07-01"));

    expect(result).toBe("INV/9907/0004");
  });

  it("YY/MM ikut tanggal invoice, bukan tanggal lain", async () => {
    await expect(db.transaction((tx) => nextInvoiceNumber(tx, "2099-01-05"))).resolves.toBe("INV/9901/0001");
    await expect(db.transaction((tx) => nextInvoiceNumber(tx, "2099-12-31"))).resolves.toBe("INV/9912/0001");
  });
});
