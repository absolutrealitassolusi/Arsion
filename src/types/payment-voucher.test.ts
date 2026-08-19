import { describe, expect, it } from "vitest";
import { calculatePvTotals } from "./payment-voucher";
import type { PaymentVoucherItem } from "./payment-voucher";

const rates = { ppnPercent: 11, pphJasaPercent: 2, pphFreelancePercent: 5 };

describe("calculatePvTotals", () => {
  it("PPN dihitung dari barang + jasa + freelance, TIDAK dari non_pajak", () => {
    const items: PaymentVoucherItem[] = [
      { category: "barang", description: "Barang", qty: 1, unitPrice: 1_000_000 },
      { category: "jasa", description: "Jasa", qty: 1, unitPrice: 1_000_000 },
      { category: "freelance", description: "Freelance", qty: 1, unitPrice: 1_000_000 },
      { category: "non_pajak", description: "Non Pajak", qty: 1, unitPrice: 1_000_000 },
    ];

    const totals = calculatePvTotals(items, { ppnPercent: 11, pphJasaPercent: 0, pphFreelancePercent: 0 });

    // Basis PPN = 3.000.000 (barang+jasa+freelance), non_pajak dikecualikan.
    expect(totals.ppnAmount).toBe(330_000);
    expect(totals.subtotal).toBe(4_000_000);
  });

  it("PPh 23 cuma dihitung dari item kategori jasa", () => {
    const items: PaymentVoucherItem[] = [
      { category: "jasa", description: "Jasa konsultasi", qty: 1, unitPrice: 1_000_000 },
      { category: "freelance", description: "Freelance", qty: 1, unitPrice: 1_000_000 },
    ];

    const totals = calculatePvTotals(items, { ppnPercent: 0, pphJasaPercent: 2, pphFreelancePercent: 5 });

    expect(totals.pphJasaAmount).toBe(20_000);
  });

  it("PPh 21 cuma dihitung dari item kategori freelance", () => {
    const items: PaymentVoucherItem[] = [
      { category: "jasa", description: "Jasa konsultasi", qty: 1, unitPrice: 1_000_000 },
      { category: "freelance", description: "Freelance", qty: 1, unitPrice: 1_000_000 },
    ];

    const totals = calculatePvTotals(items, { ppnPercent: 0, pphJasaPercent: 2, pphFreelancePercent: 5 });

    expect(totals.pphFreelanceAmount).toBe(50_000);
  });

  it("total = subtotal + PPN - PPh 23 - PPh 21", () => {
    const items: PaymentVoucherItem[] = [
      { category: "jasa", description: "Jasa konsultasi pajak", qty: 1, unitPrice: 12_500_000 },
    ];

    const totals = calculatePvTotals(items, rates);

    // subtotal 12.500.000, PPN 11% = 1.375.000, PPh 23 2% = 250.000
    expect(totals.subtotal).toBe(12_500_000);
    expect(totals.ppnAmount).toBe(1_375_000);
    expect(totals.pphJasaAmount).toBe(250_000);
    expect(totals.totalAmount).toBe(12_500_000 + 1_375_000 - 250_000);
  });

  it("qty dikaliin ke unitPrice sebelum dihitung", () => {
    const items: PaymentVoucherItem[] = [
      { category: "barang", description: "Laptop x3", qty: 3, unitPrice: 13_500_000 },
    ];

    const totals = calculatePvTotals(items, { ppnPercent: 0, pphJasaPercent: 0, pphFreelancePercent: 0 });

    expect(totals.subtotal).toBe(40_500_000);
  });

  it("array item kosong menghasilkan semua angka nol", () => {
    const totals = calculatePvTotals([], rates);

    expect(totals).toEqual({
      subtotal: 0,
      ppnAmount: 0,
      pphJasaAmount: 0,
      pphFreelanceAmount: 0,
      totalAmount: 0,
    });
  });

  it("rate 0% menghasilkan pajak nol walau ada item kena pajak", () => {
    const items: PaymentVoucherItem[] = [
      { category: "barang", description: "Barang", qty: 1, unitPrice: 1_000_000 },
    ];

    const totals = calculatePvTotals(items, { ppnPercent: 0, pphJasaPercent: 0, pphFreelancePercent: 0 });

    expect(totals.ppnAmount).toBe(0);
    expect(totals.totalAmount).toBe(1_000_000);
  });

  it("hasil pajak dibulatkan (Math.round)", () => {
    const items: PaymentVoucherItem[] = [
      { category: "barang", description: "Barang ganjil", qty: 1, unitPrice: 100_001 },
    ];

    // 100.001 * 11% = 11.000,11 -> dibulatkan jadi 11.000
    const totals = calculatePvTotals(items, { ppnPercent: 11, pphJasaPercent: 0, pphFreelancePercent: 0 });

    expect(totals.ppnAmount).toBe(11_000);
  });
});
