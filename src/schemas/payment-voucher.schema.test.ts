import { describe, expect, it } from "vitest";
import { paymentVoucherSchema } from "./payment-voucher.schema";

const validPayload = {
  direction: "out" as const,
  date: "2026-08-07",
  senderBank: "BRI - Rekening Operasional",
  partyName: "PT Testing",
  description: "Pembayaran testing",
  items: [{ category: "barang" as const, description: "Item A", qty: 1, unitPrice: 100_000 }],
  ppnPercent: 11,
  pphJasaPercent: 0,
  pphFreelancePercent: 0,
  paymentMethod: "transfer" as const,
};

describe("paymentVoucherSchema", () => {
  it("lolos kalau payload lengkap & valid", () => {
    const result = paymentVoucherSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("gagal kalau partyName kosong", () => {
    const result = paymentVoucherSchema.safeParse({ ...validPayload, partyName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.partyName).toContain("Nama vendor/customer wajib diisi");
    }
  });

  it("gagal kalau items kosong (minimal 1)", () => {
    const result = paymentVoucherSchema.safeParse({ ...validPayload, items: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.items).toContain("Minimal 1 item");
    }
  });

  it("qty & unitPrice string ke-coerce jadi number", () => {
    const result = paymentVoucherSchema.safeParse({
      ...validPayload,
      items: [{ category: "barang", description: "Item A", qty: "3", unitPrice: "50000" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0]).toEqual({
        category: "barang",
        description: "Item A",
        qty: 3,
        unitPrice: 50_000,
      });
    }
  });

  it("gagal kalau qty item 0 atau negatif", () => {
    const result = paymentVoucherSchema.safeParse({
      ...validPayload,
      items: [{ category: "barang", description: "Item A", qty: 0, unitPrice: 1000 }],
    });
    expect(result.success).toBe(false);
  });

  it("ppnPercent ditolak kalau di bawah 0 atau di atas 100", () => {
    expect(paymentVoucherSchema.safeParse({ ...validPayload, ppnPercent: -1 }).success).toBe(false);
    expect(paymentVoucherSchema.safeParse({ ...validPayload, ppnPercent: 101 }).success).toBe(false);
    expect(paymentVoucherSchema.safeParse({ ...validPayload, ppnPercent: 0 }).success).toBe(true);
    expect(paymentVoucherSchema.safeParse({ ...validPayload, ppnPercent: 100 }).success).toBe(true);
  });

  it("gagal kalau category item bukan salah satu dari 4 kategori yang valid", () => {
    const result = paymentVoucherSchema.safeParse({
      ...validPayload,
      items: [{ category: "lainnya", description: "Item A", qty: 1, unitPrice: 1000 }],
    });
    expect(result.success).toBe(false);
  });

  it("field opsional (projectNumber, poNumber, dll) boleh null atau gak diisi sama sekali", () => {
    expect(paymentVoucherSchema.safeParse({ ...validPayload, projectNumber: null }).success).toBe(true);
    expect(paymentVoucherSchema.safeParse(validPayload).success).toBe(true);
  });
});
