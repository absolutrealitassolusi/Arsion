"use client";

import { useState } from "react";
import { COMPANY } from "@/config/company";
import { useCompany } from "@/hooks/use-company";
import type { PaymentVoucher } from "@/types/payment-voucher";
import { cn, formatDateDMY } from "@/lib/utils";
import { terbilangRupiah } from "@/lib/terbilang";

const paymentMethodLabel: Record<string, string> = {
  transfer: "Transfer Bank",
  cash: "Cash",
  cheque: "Cek / Giro",
};

interface PaymentVoucherPrintProps {
  voucher: PaymentVoucher;
  /**
   * "print" (default) - dokumen cuma muncul pas benar-benar nge-print,
   * dipakai bareng tombol "Preview & Cetak" (`window.print()`).
   * "preview" - dokumen selalu keliatan di layar (dipakai di tab Approval
   * supaya approver bisa lihat persis hasil akhirnya), tapi disembunyikan
   * pas print supaya tidak dobel sama versi "print".
   */
  mode?: "print" | "preview";
  /**
   * URL tanda tangan yang SIAP PAKAI sebagai `<img src>` (signed URL Storage
   * atau data URL base64 lama - sudah di-resolve oleh parent lewat
   * `useResolvedFileUrl`/`useResolvedFileUrls`, bukan tugas komponen ini).
   * Parent yang nentuin snapshot-atau-fallback-live-lookup, lihat
   * `payment-voucher-detail-tabs.tsx` & catatan arsitektur di types/user.ts.
   */
  signatures: { prepared: string | null; approved: string | null; paid: string | null };
  /** Lampiran/bukti - juga sudah di-resolve oleh parent, siap pakai sebagai `<img src>`. */
  resolvedAttachmentUrls: string[];
  resolvedPaymentProofUrls: string[];
  resolvedTaxProofUrls: string[];
}

const formatNumber = (value: number) => new Intl.NumberFormat("id-ID").format(value);

/**
 * Dokumen Payment Voucher, format A4, mengikuti template internal (kop
 * surat + kotak meta + tabel rincian + terbilang + info bank + blok tanda
 * tangan). Lihat prop `mode` buat beda antara versi khusus-print vs versi
 * preview yang selalu tampil di layar.
 *
 * Presentational murni buat tanda tangan & lampiran - semua signed URL/data
 * URL siap pakai dioper lewat props (lihat `PaymentVoucherPrintProps`),
 * komponen ini gak nge-resolve apapun sendiri.
 */
export function PaymentVoucherPrint({
  voucher,
  mode = "print",
  signatures,
  resolvedAttachmentUrls,
  resolvedPaymentProofUrls,
  resolvedTaxProofUrls,
}: PaymentVoucherPrintProps) {
  const { data: companyData } = useCompany();
  const company = companyData?.data;
  const [logoFailed, setLogoFailed] = useState(false);

  const partyLabel = voucher.direction === "out" ? "Dibayarkan kepada" : "Diterima dari";
  const directionLabel = voucher.direction === "out" ? "OUT" : "IN";

  const signatureBlocks = [
    { label: "Dibayarkan", name: voucher.paidBy, url: signatures.paid },
    { label: "Disetujui", name: voucher.approvedBy, url: signatures.approved },
    { label: "Dibuat", name: voucher.preparedBy, url: signatures.prepared },
  ];

  const taxRows = [
    voucher.ppnAmount > 0 && {
      label: `PPN (${voucher.ppnPercent}%)`,
      value: formatNumber(voucher.ppnAmount),
    },
    voucher.pphJasaAmount > 0 && {
      label: `PPh 23 (${voucher.pphJasaPercent}%)`,
      value: `- ${formatNumber(voucher.pphJasaAmount)}`,
    },
    voucher.pphFreelanceAmount > 0 && {
      label: `PPh 21 (${voucher.pphFreelancePercent}%)`,
      value: `- ${formatNumber(voucher.pphFreelanceAmount)}`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const attachmentGroups = [
    resolvedAttachmentUrls.length > 0 && {
      label: "Lampiran",
      name: voucher.attachmentName,
      urls: resolvedAttachmentUrls,
    },
    resolvedPaymentProofUrls.length > 0 && {
      label: "Bukti Pembayaran",
      name: voucher.paymentProofFileName,
      urls: resolvedPaymentProofUrls,
    },
    resolvedTaxProofUrls.length > 0 && {
      label: "Bukti Pajak",
      name: voucher.taxProofFileName,
      urls: resolvedTaxProofUrls,
    },
  ].filter(Boolean) as { label: string; name: string | null; urls: string[] }[];

  const attachmentPages = attachmentGroups.flatMap((group) =>
    group.urls.map((url, pageIndex) => ({
      key: `${group.label}-${pageIndex}`,
      label: group.label,
      name: group.name,
      url,
      pageIndex,
      pageCount: group.urls.length,
    }))
  );

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

          <div className="mt-4 space-y-0.5 text-[10px]">
            <div className="flex">
              <span className="w-28 font-black">Nomor Project</span>
              <span className="w-3">:</span>
              <span>{voucher.projectNumber ?? "-"}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-black">No. PO</span>
              <span className="w-3">:</span>
              <span>{voucher.poNumber ?? "-"}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-black">No. Invoice</span>
              <span className="w-3">:</span>
              <span>{voucher.invoiceNumber ?? "-"}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-black">Faktur Pajak</span>
              <span className="w-3">:</span>
              <span>{voucher.taxInvoiceNumber ?? "-"}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <h1 className="inline-block border-b-2 border-black pb-1 text-2xl font-black uppercase tracking-wide">
            Payment Voucher ({directionLabel})
          </h1>
          <table className="ml-auto mt-2 w-80 table-fixed border-collapse border border-gray-400 text-[10px]">
            <tbody>
              <tr>
                <td className="w-1/2 border border-gray-400 bg-gray-200 px-2 py-1 text-right font-black">
                  Tanggal :
                </td>
                <td className="w-1/2 border border-gray-400 px-2 py-1 text-right">{formatDateDMY(voucher.date)}</td>
              </tr>
              <tr>
                <td className="w-1/2 border border-gray-400 bg-gray-200 px-2 py-1 text-right font-black">
                  No. PV :
                </td>
                <td className="w-1/2 border border-gray-400 px-2 py-1 text-right">{voucher.voucherNumber}</td>
              </tr>
              <tr>
                <td className="w-1/2 border border-gray-400 bg-gray-200 px-2 py-1 text-right font-black">
                  {partyLabel} :
                </td>
                <td className="w-1/2 border border-gray-400 px-2 py-1 text-right">{voucher.partyName}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel rincian */}
      <table className="mt-4 w-full border-collapse border border-gray-400 text-[10px]">
        <thead>
          <tr>
            <th className="w-12 border border-gray-400 bg-gray-200 px-2 py-1 font-black uppercase">Serial No.</th>
            <th className="border border-gray-400 bg-gray-200 px-2 py-1 font-black uppercase">Keterangan</th>
            <th className="w-32 border border-gray-400 bg-gray-200 px-2 py-1 font-black uppercase">Nilai</th>
          </tr>
        </thead>
        <tbody>
          {voucher.items.map((item, index) => (
            <tr key={index}>
              <td className="border border-gray-400 px-2 py-1 text-center">{index + 1}</td>
              <td className="border border-gray-400 px-2 py-1">{item.description}</td>
              <td className="border border-gray-400 px-2 py-1 text-right">
                {formatNumber(item.qty * item.unitPrice)}
              </td>
            </tr>
          ))}
          {taxRows.map((row) => (
            <tr key={row.label}>
              <td className="border border-gray-400 px-2 py-1"></td>
              <td className="border border-gray-400 px-2 py-1 text-right">{row.label}</td>
              <td className="border border-gray-400 px-2 py-1 text-right">{row.value}</td>
            </tr>
          ))}
          <tr>
            <td className="border border-gray-400 border-t-2 px-2 py-1"></td>
            <td className="border border-gray-400 border-t-2 px-2 py-1"></td>
            <td className="border border-gray-400 border-t-2 px-2 py-1 text-right font-black">
              {formatNumber(voucher.totalAmount)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Terbilang */}
      <div className="mt-3 border border-gray-400 p-2 text-[10px]">
        <span className="font-black italic">Terbilang : </span>
        <span className="font-black italic">{terbilangRupiah(voucher.totalAmount)}</span>
      </div>

      {/* Info Bank / metode pembayaran - isinya beda per arah, mengikuti field yang memang tersedia untuk masing-masing (PV In tidak punya data rekening penerima, cuma rekening kita sendiri). */}
      <div className="mt-3 border border-gray-400 p-2 text-[10px]">
        <span className="font-black italic">Info Bank : </span>
        {voucher.direction === "out" ? (
          <span>
            Bank Penerima: {voucher.receiverBankName || "-"} | No. Rekening:{" "}
            {voucher.receiverAccountNumber || "-"} | Nama Rekening: {voucher.receiverAccountName || "-"} | Metode:{" "}
            {paymentMethodLabel[voucher.paymentMethod]}
          </span>
        ) : (
          <span>
            Bank Penerima (Kita): {voucher.senderBank || "-"} | Metode: {paymentMethodLabel[voucher.paymentMethod]}
          </span>
        )}
      </div>

      {/* Tanda tangan */}
      <div className="mt-6 grid grid-cols-3 border border-gray-400 text-[10px]">
        {signatureBlocks.map((block, index) => (
          <div key={block.label} className={cn("p-3", index > 0 && "border-l border-gray-400")}>
            <p className="font-black">{block.label}</p>
            <div className="flex h-16 items-end justify-center">
              {block.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={block.url} alt="" className="max-h-14 max-w-[80%] object-contain" />
              )}
            </div>
            <p className="border-t border-gray-400 pt-1 text-center">
              {block.name ? `( ${block.name} )` : "( - )"}
            </p>
          </div>
        ))}
      </div>

      {/*
        Lampiran - tiap halaman dokumen (termasuk tiap halaman PDF) mulai di
        halaman cetak baru, isinya langsung tanpa heading/nama file. Tinggi
        273mm = tinggi A4 (297mm) dikurangi margin @page atas+bawah (12mm x 2,
        lihat globals.css) - jadi gambarnya sebesar mungkin tanpa kepotong ke
        halaman berikutnya. `object-contain` (bukan `cover`) supaya seluruh
        isi lampiran tetap kelihatan utuh, gak ada bagian yang ke-crop kalau
        rasio gambarnya beda dari A4.
      */}
      {attachmentPages.map((page) => (
        <div key={page.key} className="break-before-page flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.url}
            alt={`${page.label} halaman ${page.pageIndex + 1}`}
            className="max-h-[273mm] max-w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}
