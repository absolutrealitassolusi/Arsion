"use client";

import { useState } from "react";
import { COMPANY } from "@/config/company";
import { useCompany } from "@/hooks/use-company";
import type { Invoice } from "@/types/invoice";
import { cn, formatDateDMY } from "@/lib/utils";
import { terbilangRupiah } from "@/lib/terbilang";

interface InvoicePrintProps {
  invoice: Invoice;
  /** Sama kaya PaymentVoucherPrint - "print" cuma muncul pas window.print(), "preview" selalu tampil di layar (dipakai di halaman detail). */
  mode?: "print" | "preview";
}

const formatNumber = (value: number) => new Intl.NumberFormat("id-ID").format(value);

/**
 * Dokumen Invoice, format A4 - kop surat + kotak meta + tabel rincian +
 * terbilang + catatan + tanda tangan pembuat. Struktur dan konvensi (mode
 * print/preview, kop surat, terbilang) ngikutin PaymentVoucherPrint
 * (src/components/modules/payment-vouchers/payment-voucher-print.tsx), tapi
 * lebih simpel - gak ada lampiran/bukti pembayaran, gak ada blok approval
 * (Invoice gak punya workflow approval, lihat plan modul ini).
 */
export function InvoicePrint({ invoice, mode = "print" }: InvoicePrintProps) {
  const { data: companyData } = useCompany();
  const company = companyData?.data;
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div
      className={cn(
        "bg-white text-black print:text-[11px]",
        mode === "print" ? "hidden print:block" : "block print:hidden"
      )}
    >
      {/* Kop surat */}
      <div className="flex items-start justify-between">
        <div className="max-w-[60%]">
          {logoFailed ? (
            <p className="text-base font-black">{company?.name ?? ""}</p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={COMPANY.logoSrc}
              alt={company?.name ?? ""}
              className="h-14 w-auto object-contain"
              onError={() => setLogoFailed(true)}
            />
          )}
          <div className="mt-1 text-[9px] leading-snug text-slate-600">
            {(company?.address.split("\n") ?? []).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="text-right">
          <h1 className="inline-block border-b-2 border-black pb-1 text-2xl font-black uppercase tracking-wide">
            Invoice
          </h1>
          <table className="ml-auto mt-2 w-80 table-fixed border-collapse border border-gray-400 text-[10px]">
            <tbody>
              <tr>
                <td className="w-1/2 border border-gray-400 bg-gray-200 px-2 py-1 text-right font-black">
                  No. Invoice :
                </td>
                <td className="w-1/2 border border-gray-400 px-2 py-1 text-right">{invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td className="w-1/2 border border-gray-400 bg-gray-200 px-2 py-1 text-right font-black">
                  Tanggal :
                </td>
                <td className="w-1/2 border border-gray-400 px-2 py-1 text-right">{formatDateDMY(invoice.date)}</td>
              </tr>
              <tr>
                <td className="w-1/2 border border-gray-400 bg-gray-200 px-2 py-1 text-right font-black">
                  Jatuh Tempo :
                </td>
                <td className="w-1/2 border border-gray-400 px-2 py-1 text-right">
                  {formatDateDMY(invoice.dueDate)}
                </td>
              </tr>
              <tr>
                <td className="w-1/2 border border-gray-400 bg-gray-200 px-2 py-1 text-right font-black">
                  Ditagihkan kepada :
                </td>
                <td className="w-1/2 border border-gray-400 px-2 py-1 text-right">{invoice.customerName}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel rincian */}
      <table className="mt-4 w-full border-collapse border border-gray-400 text-[10px]">
        <thead>
          <tr>
            <th className="w-12 border border-gray-400 bg-gray-200 px-2 py-1 font-black uppercase">No.</th>
            <th className="border border-gray-400 bg-gray-200 px-2 py-1 font-black uppercase">Keterangan</th>
            <th className="w-16 border border-gray-400 bg-gray-200 px-2 py-1 font-black uppercase">Qty</th>
            <th className="w-28 border border-gray-400 bg-gray-200 px-2 py-1 font-black uppercase">Harga Satuan</th>
            <th className="w-32 border border-gray-400 bg-gray-200 px-2 py-1 font-black uppercase">Nilai</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index}>
              <td className="border border-gray-400 px-2 py-1 text-center">{index + 1}</td>
              <td className="border border-gray-400 px-2 py-1">{item.description}</td>
              <td className="border border-gray-400 px-2 py-1 text-center">{item.qty}</td>
              <td className="border border-gray-400 px-2 py-1 text-right">{formatNumber(item.unitPrice)}</td>
              <td className="border border-gray-400 px-2 py-1 text-right">
                {formatNumber(item.qty * item.unitPrice)}
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} className="border border-gray-400 px-2 py-1 text-right">
              Subtotal
            </td>
            <td className="border border-gray-400 px-2 py-1 text-right">{formatNumber(invoice.subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="border border-gray-400 px-2 py-1 text-right">
              PPN ({invoice.ppnPercent}%)
            </td>
            <td className="border border-gray-400 px-2 py-1 text-right">{formatNumber(invoice.ppnAmount)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="border border-gray-400 border-t-2 px-2 py-1 text-right font-black">
              Total
            </td>
            <td className="border border-gray-400 border-t-2 px-2 py-1 text-right font-black">
              {formatNumber(invoice.totalAmount)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Terbilang */}
      <div className="mt-3 border border-gray-400 p-2 text-[10px]">
        <span className="font-black italic">Terbilang : </span>
        <span className="font-black italic">{terbilangRupiah(invoice.totalAmount)}</span>
      </div>

      {invoice.notes && (
        <div className="mt-3 border border-gray-400 p-2 text-[10px]">
          <span className="font-black italic">Catatan : </span>
          <span>{invoice.notes}</span>
        </div>
      )}

      {/* Tanda tangan */}
      <div className="mt-6 grid grid-cols-3 border border-gray-400 text-[10px]">
        <div className="col-start-3 p-3">
          <p className="font-black">Hormat kami,</p>
          <div className="h-16" />
          <p className="border-t border-gray-400 pt-1 text-center">( {invoice.preparedBy} )</p>
        </div>
      </div>
    </div>
  );
}
