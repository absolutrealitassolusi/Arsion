import { describe, expect, it } from "vitest";
import { nextMasterCode } from "./next-master-code";

describe("nextMasterCode", () => {
  it("mulai dari PREFIX-001 kalau belum ada kode", () => {
    expect(nextMasterCode([], "VND-")).toBe("VND-001");
  });

  it("lanjut +1 dari angka terbesar, pertahankan prefix & panjang digit", () => {
    expect(nextMasterCode(["VND-002", "VND-010", "VND-003"], "VND-")).toBe("VND-011");
    expect(nextMasterCode(["SM-0099"], "VND-")).toBe("SM-0100");
  });

  it("kode tanpa angka di belakang diabaikan", () => {
    expect(nextMasterCode(["ABC", "-", "CST-004"], "CST-")).toBe("CST-005");
  });

  it("lewati kode yang kebetulan sudah dipakai", () => {
    expect(nextMasterCode(["A-009", "B-010"], "X-")).toBe("B-011");
    expect(nextMasterCode(["A-010", "A-011", "B-010"], "X-")).toBe("A-012");
  });
});
