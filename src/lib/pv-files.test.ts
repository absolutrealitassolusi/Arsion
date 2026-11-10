import { describe, expect, it } from "vitest";
import { flattenPvFiles, pvFilesFromRow } from "./pv-files";

describe("flattenPvFiles", () => {
  it("gabung nama & ratakan halaman, file tanpa halaman dibuang", () => {
    expect(
      flattenPvFiles([
        { name: "invoice.pdf", urls: ["a1", "a2"] },
        { name: "kosong.jpg", urls: [] },
        { name: "po.jpg", urls: ["b1"] },
      ])
    ).toEqual({ name: "invoice.pdf, po.jpg", urls: ["a1", "a2", "b1"] });
  });

  it("daftar kosong -> name null", () => {
    expect(flattenPvFiles([])).toEqual({ name: null, urls: [] });
  });
});

describe("pvFilesFromRow", () => {
  it("pakai daftar file kalau ada", () => {
    expect(pvFilesFromRow([{ name: "x", urls: ["1"] }], "lama", ["9"])).toEqual([{ name: "x", urls: ["1"] }]);
  });

  it("PV lama: kolom lama dianggap 1 file", () => {
    expect(pvFilesFromRow([], "invoice.pdf", ["1", "2"])).toEqual([{ name: "invoice.pdf", urls: ["1", "2"] }]);
    expect(pvFilesFromRow(null, null, [])).toEqual([]);
  });
});
