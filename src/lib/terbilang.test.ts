import { describe, expect, it } from "vitest";
import { terbilangRupiah } from "./terbilang";

describe("terbilangRupiah", () => {
  it("nol", () => {
    expect(terbilangRupiah(0)).toBe("Nol Rupiah");
  });

  it("angka satu digit", () => {
    expect(terbilangRupiah(1)).toBe("Satu Rupiah");
    expect(terbilangRupiah(9)).toBe("Sembilan Rupiah");
  });

  it("sebelas itu kasus khusus, bukan 'sepuluh satu'", () => {
    expect(terbilangRupiah(11)).toBe("Sebelas Rupiah");
  });

  it("belasan lain (12-19) pakai pola '... belas'", () => {
    expect(terbilangRupiah(12)).toBe("Dua Belas Rupiah");
    expect(terbilangRupiah(17)).toBe("Tujuh Belas Rupiah");
  });

  it("puluhan", () => {
    expect(terbilangRupiah(20)).toBe("Dua Puluh Rupiah");
    expect(terbilangRupiah(21)).toBe("Dua Puluh Satu Rupiah");
  });

  it("seratus itu kasus khusus, bukan 'satu ratus'", () => {
    expect(terbilangRupiah(100)).toBe("Seratus Rupiah");
    expect(terbilangRupiah(101)).toBe("Seratus Satu Rupiah");
  });

  it("ratusan biasa pakai '... ratus'", () => {
    expect(terbilangRupiah(500)).toBe("Lima Ratus Rupiah");
  });

  it("seribu itu kasus khusus, bukan 'satu ribu'", () => {
    expect(terbilangRupiah(1_000)).toBe("Seribu Rupiah");
  });

  it("ribuan biasa pakai '... ribu'", () => {
    expect(terbilangRupiah(2_000)).toBe("Dua Ribu Rupiah");
  });

  it("jutaan", () => {
    expect(terbilangRupiah(1_000_000)).toBe("Satu Juta Rupiah");
  });

  it("miliaran", () => {
    expect(terbilangRupiah(1_000_000_000)).toBe("Satu Miliar Rupiah");
  });

  it("angka gabungan grup ribuan+jutaan (nilai PV nyata yang sudah pernah dicek manual di aplikasi)", () => {
    // PV-0002 di data dummy: subtotal 12.500.000 - PPh 23 2% (250.000) = 12.250.000
    expect(terbilangRupiah(12_250_000)).toBe("Dua Belas Juta Dua Ratus Lima Puluh Ribu Rupiah");
  });

  it("group tengah yang nol dilewat, gak nyisain 'nol' nyempil", () => {
    // 1.000.001 -> grup ribuan-nya 0, harus dilewat, bukan "satu juta nol ribu satu"
    expect(terbilangRupiah(1_000_001)).toBe("Satu Juta Satu Rupiah");
  });
});
