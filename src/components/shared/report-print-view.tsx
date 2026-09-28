import type { ReportSheetData } from "@/lib/export-excel";

interface ReportPrintViewProps {
  title: string;
  periodLabel: string;
  summarySheet: ReportSheetData;
  detailSheet: ReportSheetData;
}

/**
 * Versi cetak/PDF laporan - cuma tampil pas window.print() (lihat "hidden
 * print:block" di bawah), sama polanya kaya PaymentVoucherPrint/InvoicePrint.
 * Data yang ditampilin (summarySheet/detailSheet) sengaja bentuknya sama
 * persis kaya yang dikirim ke buildReportWorkbook (src/lib/export-excel.ts) -
 * biar PDF dan Excel isinya selalu konsisten, satu sumber data.
 */
export function ReportPrintView({ title, periodLabel, summarySheet, detailSheet }: ReportPrintViewProps) {
  return (
    <div className="hidden bg-white text-black print:block print:text-[11px]">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-sm text-neutral-600">Periode: {periodLabel}</p>
      <p className="text-sm text-neutral-600">Dicetak: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>

      <h2 className="mt-6 mb-2 text-sm font-semibold">Ringkasan</h2>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {summarySheet.headers.map((h) => (
              <th key={h} className="border border-neutral-400 bg-neutral-100 px-2 py-1 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summarySheet.rows.map((row, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={i}>
              {row.map((cell, j) => (
                // eslint-disable-next-line react/no-array-index-key
                <td key={j} className="border border-neutral-300 px-2 py-1">
                  {typeof cell === "number" ? cell.toLocaleString("id-ID") : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-6 mb-2 text-sm font-semibold">Rincian</h2>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {detailSheet.headers.map((h) => (
              <th key={h} className="border border-neutral-400 bg-neutral-100 px-2 py-1 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {detailSheet.rows.length === 0 && (
            <tr>
              <td colSpan={detailSheet.headers.length} className="border border-neutral-300 px-2 py-4 text-center text-neutral-500">
                Tidak ada data pada periode/status ini.
              </td>
            </tr>
          )}
          {detailSheet.rows.map((row, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={i}>
              {row.map((cell, j) => (
                // eslint-disable-next-line react/no-array-index-key
                <td key={j} className="border border-neutral-300 px-2 py-1">
                  {typeof cell === "number" ? cell.toLocaleString("id-ID") : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
