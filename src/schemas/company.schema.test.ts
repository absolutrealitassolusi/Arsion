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
});
