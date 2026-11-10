import { describe, expect, it } from "vitest";
import { vendorSchema } from "./vendor.schema";

const validVendor = {
  name: "PT Sumber Makmur",
  code: "VND-001",
  npwp: "01.234.567.8-901.000",
  address: "Jl. Mangga No. 1",
  bankName: "BCA",
  bankAccountNumber: "1234567890",
  bankAccountName: "PT Sumber Makmur",
};

describe("vendorSchema", () => {
  it("lolos kalau vendor lengkap & valid", () => {
    expect(vendorSchema.safeParse(validVendor).success).toBe(true);
  });

  it("gagal kalau nama kurang dari 3 karakter", () => {
    const result = vendorSchema.safeParse({ ...validVendor, name: "AB" });
    expect(result.success).toBe(false);
  });

  it("kode vendor cuma boleh huruf kapital, angka, dan minus", () => {
    expect(vendorSchema.safeParse({ ...validVendor, code: "vnd-001" }).success).toBe(false);
    expect(vendorSchema.safeParse({ ...validVendor, code: "VND 001" }).success).toBe(false);
    expect(vendorSchema.safeParse({ ...validVendor, code: "VND-001" }).success).toBe(true);
  });

  it("phone opsional, boleh gak diisi", () => {
    expect(vendorSchema.safeParse(validVendor).success).toBe(true);
  });

  it("NPWP, alamat, dan rekening boleh kosong (dilengkapi belakangan)", () => {
    expect(vendorSchema.safeParse({ name: "Budi Freelance" }).success).toBe(true);
    expect(vendorSchema.safeParse({ ...validVendor, address: "", npwp: "", bankName: "" }).success).toBe(true);
  });

  it("kode boleh kosong - nanti diisi otomatis server", () => {
    expect(vendorSchema.parse({ ...validVendor, code: "" }).code).toBe("");
    expect(vendorSchema.parse({ name: "PT Tanpa Kode" }).code).toBe("");
  });
});
