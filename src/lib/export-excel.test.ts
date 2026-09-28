import { describe, expect, it } from "vitest";
import { buildReportWorkbook } from "./export-excel";

describe("buildReportWorkbook", () => {
  it("bikin 2 sheet: Ringkasan dan Rincian", () => {
    const workbook = buildReportWorkbook({
      title: "Laporan Test",
      periodLabel: "September 2026",
      summarySheet: { headers: ["Status", "Jumlah"], rows: [["Draft", 2]] },
      detailSheet: { headers: ["No", "Nama"], rows: [["1", "A"]] },
    });

    const sheetNames = workbook.worksheets.map((s) => s.name);
    expect(sheetNames).toEqual(["Ringkasan", "Rincian"]);
  });

  it("nulis judul, periode, header, dan baris data di posisi yang benar", () => {
    const workbook = buildReportWorkbook({
      title: "Laporan Test",
      periodLabel: "September 2026",
      summarySheet: {
        headers: ["Status", "Jumlah"],
        rows: [
          ["Draft", 2],
          ["Lunas", 5],
        ],
      },
      detailSheet: { headers: ["No"], rows: [] },
    });

    const summary = workbook.getWorksheet("Ringkasan")!;
    expect(summary.getRow(1).getCell(1).value).toBe("Laporan Test");
    expect(summary.getRow(2).getCell(1).value).toBe("Periode: September 2026");
    expect(summary.getRow(4).getCell(1).value).toBe("Status");
    expect(summary.getRow(4).getCell(2).value).toBe("Jumlah");
    expect(summary.getRow(5).getCell(1).value).toBe("Draft");
    expect(summary.getRow(5).getCell(2).value).toBe(2);
    expect(summary.getRow(6).getCell(1).value).toBe("Lunas");
  });

  it("header row di-bold", () => {
    const workbook = buildReportWorkbook({
      title: "T",
      periodLabel: "P",
      summarySheet: { headers: ["A"], rows: [] },
      detailSheet: { headers: ["B"], rows: [] },
    });

    const summary = workbook.getWorksheet("Ringkasan")!;
    expect(summary.getRow(4).font?.bold).toBe(true);
  });

  it("sheet Rincian kosong (0 baris) gak error, cuma judul+header doang", () => {
    const workbook = buildReportWorkbook({
      title: "T",
      periodLabel: "P",
      summarySheet: { headers: ["A"], rows: [] },
      detailSheet: { headers: ["No. Invoice", "Total"], rows: [] },
    });

    const detail = workbook.getWorksheet("Rincian")!;
    expect(detail.rowCount).toBe(4);
    expect(detail.getRow(4).getCell(1).value).toBe("No. Invoice");
  });
});
