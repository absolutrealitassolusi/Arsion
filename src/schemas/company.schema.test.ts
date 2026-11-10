import { describe, expect, it } from "vitest";
import { companySchema } from "./company.schema";

const validPayload = {
  name: "PT. Absolut Realitas Solusi",
  address: "Jl. Contoh No. 1\nJakarta Selatan 12345",
  npwp: "01.234.567.8-901.000",
  phone: "021-5551234",
  email: "info@arsion.app",
};

describe("companySchema", () => {
  it("lolos kalau payload lengkap & valid", () => {
    expect(companySchema.safeParse(validPayload).success).toBe(true);
  });

  it("gagal kalau nama kosong", () => {
    const result = companySchema.safeParse({ ...validPayload, name: "" });
    expect(result.success).toBe(false);
  });

  it("gagal kalau alamat kosong", () => {
    expect(companySchema.safeParse({ ...validPayload, address: "" }).success).toBe(false);
  });

  it("gagal kalau npwp atau telepon kosong", () => {
    expect(companySchema.safeParse({ ...validPayload, npwp: "" }).success).toBe(false);
    expect(companySchema.safeParse({ ...validPayload, phone: "" }).success).toBe(false);
  });

  it("gagal kalau email formatnya bukan email", () => {
    const result = companySchema.safeParse({ ...validPayload, email: "bukan-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain("Email tidak valid");
    }
  });

  it("setting penomoran PV default ke format lama (45, 4 digit, bulanan) kalau gak dikirim", () => {
    const result = companySchema.parse(validPayload);
    expect(result).toMatchObject({ pvCode: "45", pvSeqLength: 4, pvResetMode: "monthly" });
  });

  it("gagal kalau kode PV bukan angka atau panjang nomor urut di luar 3-6", () => {
    expect(companySchema.safeParse({ ...validPayload, pvCode: "4A" }).success).toBe(false);
    expect(companySchema.safeParse({ ...validPayload, pvSeqLength: 2 }).success).toBe(false);
    expect(companySchema.safeParse({ ...validPayload, pvSeqLength: 7 }).success).toBe(false);
    expect(companySchema.safeParse({ ...validPayload, pvResetMode: "weekly" }).success).toBe(false);
  });
});
