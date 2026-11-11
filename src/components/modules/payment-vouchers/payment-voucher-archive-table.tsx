"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Archive as ArchiveIcon, ArrowDownLeft, ArrowUpRight, Paperclip } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePaymentVouchers } from "@/hooks/use-payment-vouchers";
import { useCompany } from "@/hooks/use-company";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { PvStatus } from "@/types/payment-voucher";

const statusMap: Record<PvStatus, { label: string; variant: "secondary" | "default" | "success" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Menunggu Approval", variant: "default" },
  approved: { label: "Disetujui", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  paid: { label: "Dibayar", variant: "success" },
  cancelled: { label: "Dibatalkan", variant: "secondary" },
};

const COLUMN_COUNT = 10;

/** Nilai yang baru berubah setelah `delay` ms tanpa perubahan - biar ngetik di kotak cari gak nembak API tiap huruf. */
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Read-only - Arsip cuma buat nelusurin histori transaksi operasional,
 * gak ada aksi Edit/Hapus/workflow di sini (itu semua ada di modul
 * Payment Voucher-nya sendiri).
 */
export function PaymentVoucherArchiveTable() {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState("");
  const [bank, setBank] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const { data, isLoading, isError, error } = usePaymentVouchers({
    search: debouncedSearch,
    direction: (direction || undefined) as "in" | "out" | undefined,
    status: (status || undefined) as PvStatus | undefined,
  });
  const { data: companyData } = useCompany();

  const all = data?.data ?? [];
  // Pilihan bank = Daftar Bank Perusahaan + bank yang sudah terpakai di PV
  // (PV lama bisa pakai bank yang sudah dihapus dari daftar).
  const bankOptions = Array.from(
    new Set([...(companyData?.data?.banks ?? []), ...all.map((v) => v.senderBank).filter(Boolean)])
  );
  // Filter bank di sisi browser (bukan API) supaya pilihan bank di atas
  // tetap lengkap walaupun hasilnya sedang difilter. PV Dibatalkan ditaruh
  // paling bawah - urutan lainnya tetap terbaru dulu dari API.
  const vouchers = all
    .filter((v) => !bank || v.senderBank === bank)
    .sort((a, b) => Number(a.status === "cancelled") - Number(b.status === "cancelled"));
  const isFiltered = Boolean(debouncedSearch || direction || status || bank);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Cari no. PV, nama, atau keterangan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={direction || "all"} onValueChange={(v) => setDirection(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Arah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Arah</SelectItem>
            <SelectItem value="in">PV In</SelectItem>
            <SelectItem value="out">PV Out</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Menunggu Approval</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
            <SelectItem value="paid">Dibayar</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={bank || "all"} onValueChange={(v) => setBank(v === "all" ? "" : v)}>
          <SelectTrigger className="w-56" aria-label="Bank Pengirim">
            <SelectValue placeholder="Bank" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bank</SelectItem>
            {bankOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isLoading && !isError && (
          <span className="ml-auto text-sm text-muted-foreground">{vouchers.length} voucher</span>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. PV</TableHead>
            <TableHead>Arah</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Vendor / Customer</TableHead>
            <TableHead>Keterangan</TableHead>
            <TableHead>Bank Pengirim</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dokumen</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        {isLoading ? (
          <TableSkeleton rows={5} columns={COLUMN_COUNT} />
        ) : (
          <TableBody>
            {isError && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-sm text-destructive">
                  {(error as { message?: string })?.message ?? "Gagal memuat arsip."}
                </TableCell>
              </TableRow>
            )}

            {!isError && vouchers.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ArchiveIcon className="h-8 w-8" />
                    <p className="text-sm">
                      {isFiltered ? "Tidak ada PV yang cocok dengan pencarian/filter ini." : "Belum ada transaksi tercatat."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {vouchers.map((voucher) => {
              const st = statusMap[voucher.status];
              return (
                <TableRow key={voucher.id} className={cn(voucher.status === "cancelled" && "opacity-50")}>
                  <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                  <TableCell>
                    {voucher.direction === "in" ? (
                      <span className="flex items-center gap-1 text-success">
                        <ArrowDownLeft className="h-3.5 w-3.5" /> In
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-primary">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Out
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(voucher.date)}</TableCell>
                  <TableCell>{voucher.partyName}</TableCell>
                  <TableCell className="max-w-[12rem] truncate text-muted-foreground" title={voucher.description}>
                    {voucher.description || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{voucher.senderBank || "-"}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(voucher.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" /> {voucher.documentCount ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/finance/archive/${voucher.id}`}>
                        <Eye className="h-4 w-4" /> Lihat
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>
    </div>
  );
}
