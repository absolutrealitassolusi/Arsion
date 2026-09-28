import ExcelJS from "exceljs";

export interface ReportSheetData {
  headers: string[];
  rows: (string | number)[][];
}

export interface ReportWorkbookOptions {
  title: string;
  periodLabel: string;
  summarySheet: ReportSheetData;
  detailSheet: ReportSheetData;
}

function writeSheet(workbook: ExcelJS.Workbook, sheetName: string, title: string, periodLabel: string, data: ReportSheetData) {
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow([title]).font = { bold: true, size: 14 };
  sheet.addRow([`Periode: ${periodLabel}`]).font = { italic: true, color: { argb: "FF666666" } };
  sheet.addRow([]);

  const headerRow = sheet.addRow(data.headers);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF2F7" } };
  });

  for (const row of data.rows) {
    sheet.addRow(row);
  }

  sheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const length = String(cell.value ?? "").length;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(maxLength + 2, 40);
  });
}

/** PURE - gampang ditest, gak nyentuh browser API apapun. */
export function buildReportWorkbook(opts: ReportWorkbookOptions): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Arsion";
  workbook.created = new Date();

  writeSheet(workbook, "Ringkasan", opts.title, opts.periodLabel, opts.summarySheet);
  writeSheet(workbook, "Rincian", opts.title, opts.periodLabel, opts.detailSheet);

  return workbook;
}

/** I/O browser - trigger download file .xlsx lewat Blob + <a>. */
export async function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
