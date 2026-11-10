import { describe, expect, it } from "vitest";
import { paymentVoucherSchema, todayInJakarta } from "./payment-voucher.schema";

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

  it("tanggal hari ini boleh, tanggal besok ditolak", () => {
    const today = todayInJakarta();
    const tomorrow = todayInJakarta(new Date(Date.now() + 24 * 60 * 60 * 1000));
    expect(paymentVoucherSchema.safeParse({ ...validPayload, date: today }).success).toBe(true);
    const result = paymentVoucherSchema.safeParse({ ...validPayload, date: tomorrow });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.date).toContain("Tanggal PV tidak boleh lebih maju dari hari ini");
    }
  });

  it("tanggal wajib format YYYY-MM-DD", () => {
    expect(paymentVoucherSchema.safeParse({ ...validPayload, date: "07/08/2026" }).success).toBe(false);
  });
});

describe("todayInJakarta", () => {
  it("pakai tanggal WIB, bukan UTC (jam 20:00 UTC = besoknya di WIB)", () => {
    expect(todayInJakarta(new Date("2026-11-10T20:00:00Z"))).toBe("2026-11-11");
    expect(todayInJakarta(new Date("2026-11-10T10:00:00Z"))).toBe("2026-11-10");
  });
});
