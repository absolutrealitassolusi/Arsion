"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer, Send, Check, X, Wallet, Save, Paperclip, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ITEM_CATEGORY_LABELS, type PaymentVoucher, type PvStatus } from "@/types/payment-voucher";
import {
  usePaymentVoucher,
  useSubmitPaymentVoucher,
  useApprovePaymentVoucher,
  useRejectPaymentVoucher,
  useMarkPaymentVoucherPaid,
  useUpdateTaxInvoice,
  useUploadPaymentProof,
} from "@/hooks/use-payment-vouchers";
import { useUsers } from "@/hooks/use-users";
import { useHasPermission } from "@/hooks/use-has-permission";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUploadDataUrls } from "@/hooks/use-file-upload";
import { useResolvedFileUrls, useResolvedFileUrl } from "@/hooks/use-resolved-file-urls";
import { getErrorMessage } from "@/lib/axios";
import { PERMISSIONS } from "@/config/permissions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { fileToPreviewDataUrls } from "@/lib/file-to-data-url";
import { PaymentVoucherPrint } from "@/components/modules/payment-vouchers/payment-voucher-print";
import { FilePreviewThumbnails } from "@/components/modules/payment-vouchers/file-preview-thumbnails";

interface FileInput {
  name: string;
  /** Path Storage (atau data URL lama) - ini yang disimpan ke server, BUKAN buat preview langsung. */
  urls: string[];
}

const statusMap: Record<PvStatus, { label: string; variant: "secondary" | "default" | "success" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Menunggu Approval", variant: "default" },
  approved: { label: "Disetujui", variant: "success" },
  rejected: { label: "Ditolak", variant: "destructive" },
  paid: { label: "Dibayar", variant: "success" },
};

const historyStatusLabel: Record<PvStatus, string> = {
  draft: "Dibuat sebagai Draft",
  submitted: "Diajukan untuk Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  paid: "Ditandai Sudah Dibayar",
};

const paymentMethodLabel: Record<string, string> = {
  transfer: "Transfer Bank",
  cash: "Cash",
  cheque: "Cek / Giro",
};

const tabs = [
  { key: "info", label: "Info" },
  { key: "approval", label: "Approval" },
  { key: "payment", label: "Payment" },
  { key: "tax", label: "Tax" },
  { key: "history", label: "History" },
];

type PendingAction = "submit" | "approve" | "reject" | "pay" | null;

interface PaymentVoucherDetailTabsProps {
  voucherId: string;
  /** Tab yang otomatis kebuka - dipakai pas "Lihat" diklik dari worklist Approval/Payment/Tax. */
  initialTab?: string;
  /**
   * Kalau diisi, abis approve/reject/tandai dibayar sukses langsung balik
   * ke halaman ini (biasanya worklist asalnya, mis. "/finance/approval") -
   * sama pola-nya kaya form PV yang selalu balik ke tabel abis submit.
   * Kosongin kalau dipakai dari halaman detail PV biasa (gak ada worklist
   * buat balik).
   */
  backToListPath?: string;
}

interface DirectionLabels {
  party: string;
  senderBank: string;
  receiverBank: string;
  receiverAccountName: string;
  receiverAccountNumber: string;
}

/**
 * Ringkasan isi PV (party, rincian item, total, lampiran) - dipakai di tab
 * Info dan juga tab Approval, supaya approver bisa langsung lihat isinya
 * tanpa harus pindah tab atau buka Preview & Cetak dulu.
 */
function VoucherSummary({ voucher, labels }: { voucher: PaymentVoucher; labels: DirectionLabels }) {
  const attachmentPreview = useResolvedFileUrls(voucher.attachmentUrls ?? undefined);
  const attachmentPreviewUrls = (attachmentPreview.data ?? []).filter((u): u is string => u !== null);

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">{labels.senderBank}</dt>
          <dd className="text-sm font-medium">{voucher.senderBank}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Tanggal</dt>
          <dd className="text-sm font-medium">{formatDate(voucher.date)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{labels.party}</dt>
          <dd className="text-sm font-medium">{voucher.partyName}</dd>
        </div>
        {voucher.direction === "out" && (
          <div>
            <dt className="text-xs text-muted-foreground">Metode Pembayaran</dt>
            <dd className="text-sm font-medium">{paymentMethodLabel[voucher.paymentMethod]}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted-foreground">Nomor Project</dt>
          <dd className="text-sm font-medium">{voucher.projectNumber ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Nomor PO</dt>
          <dd className="text-sm font-medium">{voucher.poNumber ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Nomor Invoice</dt>
          <dd className="text-sm font-medium">{voucher.invoiceNumber ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Faktur Pajak</dt>
          <dd className="text-sm font-medium">
            {voucher.taxInvoiceNumber ?? (
              <span className="text-muted-foreground">
                {voucher.status === "paid" ? "-" : "Diisi setelah dibayar"}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Lampiran</dt>
          <dd className="text-sm font-medium">{voucher.attachmentName ?? "Tidak ada"}</dd>
          <FilePreviewThumbnails urls={attachmentPreviewUrls} altPrefix="Preview lampiran" className="mt-2" />

        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Keterangan</dt>
          <dd className="text-sm font-medium">{voucher.description}</dd>
        </div>
      </dl>

      <div className="space-y-3">
        <p className="text-sm font-medium">Rincian Item</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Harga Satuan</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voucher.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell>{ITEM_CATEGORY_LABELS[item.category]}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.qty * item.unitPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between rounded-[10px] border border-border bg-secondary/40 p-4 text-base font-semibold">
        <span>Total</span>
        <span className="text-primary">{formatCurrency(voucher.totalAmount)}</span>
      </div>
    </div>
  );
}

export function PaymentVoucherDetailTabs({ voucherId, initialTab, backToListPath }: PaymentVoucherDetailTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab ?? "info");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [rejectNoteInput, setRejectNoteInput] = useState("");

  const { data, isLoading } = usePaymentVoucher(voucherId);
  const submitVoucher = useSubmitPaymentVoucher(voucherId);
  const approveVoucher = useApprovePaymentVoucher(voucherId);
  const rejectVoucher = useRejectPaymentVoucher(voucherId);
  const payVoucher = useMarkPaymentVoucherPaid(voucherId);
  const updateTaxInvoice = useUpdateTaxInvoice(voucherId);
  const uploadPaymentProof = useUploadPaymentProof(voucherId);
  const uploadPaymentProofFile = useUploadDataUrls();
  const uploadTaxProofFile = useUploadDataUrls();

  const currentUser = useCurrentUser();
  const canApprove = useHasPermission(PERMISSIONS.PV_APPROVE);
  const canPay = useHasPermission(PERMISSIONS.PV_PAY);

  const [taxInvoiceInput, setTaxInvoiceInput] = useState("");
  const [taxProofInput, setTaxProofInput] = useState<FileInput | null>(null);
  const [paymentProofInput, setPaymentProofInput] = useState<FileInput | null>(null);
  // Preview lokal instan pas user baru pilih file (data URL) - beda dari
  // `*ProofInput.urls` (path Storage yang beneran disimpan). null = belum
  // ganti file baru sejak PV ini dibuka, preview pakai yang sudah tersimpan.
  const [freshPaymentProofPreview, setFreshPaymentProofPreview] = useState<string[] | null>(null);
  const [freshTaxProofPreview, setFreshTaxProofPreview] = useState<string[] | null>(null);

  const voucher = data?.data;
  // Cuma pembuat PV yang boleh edit draft-nya / edit & ajukan ulang yang
  // ditolak - approve/reject sendiri BOLEH (finance kadang acc PV nilai
  // kecil buatannya sendiri), gak ada guard segregation-of-duties di situ.
  const isOwnVoucher = voucher?.preparedBy === currentUser.name;

  const { data: usersData } = useUsers();
  /** Snapshot kalau ada (PV baru); fallback lookup-live-by-name (PV lama, sebelum fitur snapshot ada) - lihat types/user.ts. */
  const signatureFallback = (name: string | null) =>
    name ? (usersData?.data.find((u) => u.name === name)?.signatureUrl ?? null) : null;
  const rawSignatures = voucher
    ? {
        prepared: voucher.preparedSignatureSnapshot ?? signatureFallback(voucher.preparedBy),
        approved: voucher.approvedSignatureSnapshot ?? signatureFallback(voucher.approvedBy),
        paid: voucher.paidSignatureSnapshot ?? signatureFallback(voucher.paidBy),
      }
    : { prepared: null, approved: null, paid: null };
  const resolvedPrepared = useResolvedFileUrl(rawSignatures.prepared);
  const resolvedApproved = useResolvedFileUrl(rawSignatures.approved);
  const resolvedPaid = useResolvedFileUrl(rawSignatures.paid);
  const resolvedSignatures = { prepared: resolvedPrepared.data, approved: resolvedApproved.data, paid: resolvedPaid.data };

  const existingPaymentProofPreview = useResolvedFileUrls(voucher?.paymentProofUrls ?? undefined);
  const existingTaxProofPreview = useResolvedFileUrls(voucher?.taxProofUrls ?? undefined);
  const existingAttachmentPreview = useResolvedFileUrls(voucher?.attachmentUrls ?? undefined);
  const notNull = (arr: (string | null)[] | undefined) => (arr ?? []).filter((u): u is string => u !== null);
  // Buat "Preview Dokumen" (persis hasil cetak) - cuma yang SUDAH TERSIMPAN
  // di server, sama kaya perilaku sebelumnya (belum reflect file yang baru
  // dipilih tapi belum di-"Simpan").
  const printAttachmentUrls = notNull(existingAttachmentPreview.data);
  const printPaymentProofUrls = notNull(existingPaymentProofPreview.data);
  const printTaxProofUrls = notNull(existingTaxProofPreview.data);
  // Buat thumbnail kecil di bawah tombol upload - boleh langsung reflect
  // file yang baru dipilih (instan), beda dari preview dokumen besar di atas.
  const paymentProofPreviewUrls = freshPaymentProofPreview ?? printPaymentProofUrls;
  const taxProofPreviewUrls = freshTaxProofPreview ?? printTaxProofUrls;

  useEffect(() => {
    if (voucher) {
      setTaxInvoiceInput(voucher.taxInvoiceNumber ?? "");
      setTaxProofInput(
        voucher.taxProofFileName && voucher.taxProofUrls
          ? { name: voucher.taxProofFileName, urls: voucher.taxProofUrls }
          : null
      );
      setPaymentProofInput(
        voucher.paymentProofFileName && voucher.paymentProofUrls
          ? { name: voucher.paymentProofFileName, urls: voucher.paymentProofUrls }
          : null
      );
      setFreshPaymentProofPreview(null);
      setFreshTaxProofPreview(null);
    }
  }, [voucher]);

  const handlePaymentProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const previewUrls = await fileToPreviewDataUrls(file);
      setFreshPaymentProofPreview(previewUrls);
      const paths = await uploadPaymentProofFile.mutateAsync({ dataUrls: previewUrls, kind: "pv-payment-proof", baseName: file.name });
      setPaymentProofInput({ name: file.name, urls: paths });
    } catch (err) {
      toast.error(getErrorMessage(err, `Gagal membaca file "${file.name}" - coba file lain.`));
      setFreshPaymentProofPreview(null);
    } finally {
      // Reset supaya user bisa pilih file yang sama persis lagi nanti - tanpa
      // ini, browser tidak nge-fire onChange kalau value-nya tidak berubah.
      input.value = "";
    }
  };

  const handleTaxProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const previewUrls = await fileToPreviewDataUrls(file);
      setFreshTaxProofPreview(previewUrls);
      const paths = await uploadTaxProofFile.mutateAsync({ dataUrls: previewUrls, kind: "pv-tax-proof", baseName: file.name });
      setTaxProofInput({ name: file.name, urls: paths });
    } catch (err) {
      toast.error(getErrorMessage(err, `Gagal membaca file "${file.name}" - coba file lain.`));
      setFreshTaxProofPreview(null);
    } finally {
      input.value = "";
    }
  };

  if (isLoading || !voucher) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Memuat data Payment Voucher...
        </CardContent>
      </Card>
    );
  }

  const status = statusMap[voucher.status];
  const editPath = `/finance/pv/${voucher.direction === "in" ? "pv-in" : "pv-out"}/${voucher.id}/edit`;
  const labels =
    voucher.direction === "out"
      ? {
          party: "Dibayarkan Kepada",
          senderBank: "Bank Pengirim",
          receiverBank: "Bank Penerima",
          receiverAccountName: "Nama Rekening",
          receiverAccountNumber: "Nomor Akun Penerima",
        }
      : {
          party: "Diterima Dari",
          senderBank: "Bank Penerima (Kita)",
          receiverBank: "Bank Pengirim",
          receiverAccountName: "Nama Rekening Pengirim",
          receiverAccountNumber: "Nomor Rekening Pengirim",
        };

  const isActionPending =
    submitVoucher.isPending || approveVoucher.isPending || rejectVoucher.isPending || payVoucher.isPending;

  const actionConfig: Record<Exclude<PendingAction, null>, {
    title: string;
    description: string;
    confirmLabel: string;
    run: () => void;
  }> = {
    submit: {
      title: "Ajukan Payment Voucher ini untuk approval?",
      description: "Setelah diajukan, isi PV tidak bisa diubah lagi kecuali ditolak dan dibuat ulang.",
      confirmLabel: "Ajukan",
      run: () => submitVoucher.mutate(),
    },
    approve: {
      title: "Setujui Payment Voucher ini?",
      description: "PV yang disetujui akan bisa ditandai sudah dibayar di tab Payment.",
      confirmLabel: "Setujui",
      run: () =>
        approveVoucher.mutate(undefined, {
          onSuccess: () => backToListPath && router.push(backToListPath),
        }),
    },
    reject: {
      title: "Tolak Payment Voucher ini?",
      description: "Pembuatnya bisa edit & mengajukan ulang PV ini setelah ditolak.",
      confirmLabel: "Tolak",
      run: () =>
        rejectVoucher.mutate(rejectNoteInput.trim() || undefined, {
          onSuccess: () => backToListPath && router.push(backToListPath),
        }),
    },
    pay: {
      title: "Tandai Payment Voucher ini sudah dibayar?",
      description: "Pastikan pembayaran sudah benar-benar dilakukan sebelum menandai ini.",
      confirmLabel: "Tandai Dibayar",
      run: () =>
        payVoucher.mutate(undefined, {
          onSuccess: () => {
            if (paymentProofInput) {
              uploadPaymentProof.mutate({
                paymentProofFileName: paymentProofInput.name,
                paymentProofUrls: paymentProofInput.urls,
              });
            }
            if (backToListPath) router.push(backToListPath);
          },
        }),
    },
  };

  const rejectionNote = [...voucher.history].reverse().find((h) => h.status === "rejected")?.note;

  return (
    <div className="space-y-4">
      {/*
        PaymentVoucherPrint ditaruh paling pertama supaya di mode print dia
        tidak kena margin-top dari space-y-4 - kalau ditaruh setelah elemen
        yang print:hidden, marginnya tetap kehitung (space-y cuma ngecek
        struktur DOM, bukan display:none) dan bikin gap kosong nampilin
        warna background di atas dokumen.
      */}
      <PaymentVoucherPrint
        voucher={voucher}
        signatures={resolvedSignatures}
        resolvedAttachmentUrls={printAttachmentUrls}
        resolvedPaymentProofUrls={printPaymentProofUrls}
        resolvedTaxProofUrls={printTaxProofUrls}
      />

      <div className="flex justify-end print:hidden">
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Preview & Cetak
        </Button>
      </div>

      <Card className="print:hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{voucher.voucherNumber}</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </CardHeader>

        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="px-6" />

        <CardContent className="pt-6">
          {activeTab === "info" && (
            <div className="space-y-6">
              {voucher.status === "draft" && (
                <div className="flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
                  <span>PV ini masih Draft dan belum diajukan untuk approval.</span>
                  <Button type="button" size="sm" onClick={() => setActiveTab("approval")}>
                    <Send className="h-4 w-4" />
                    Ajukan Sekarang
                  </Button>
                </div>
              )}

              <VoucherSummary voucher={voucher} labels={labels} />
            </div>
          )}

          {activeTab === "approval" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge variant={status.variant} className="text-sm">{status.label}</Badge>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Diajukan oleh</dt>
                  <dd className="text-sm font-medium">{voucher.preparedBy}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Disetujui oleh</dt>
                  <dd className="text-sm font-medium">{voucher.approvedBy ?? "Belum disetujui"}</dd>
                </div>
                {voucher.status === "rejected" && rejectionNote && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Alasan Penolakan</dt>
                    <dd className="text-sm font-medium">{rejectionNote}</dd>
                  </div>
                )}
              </dl>

              <div className="flex flex-wrap gap-2">
                {voucher.status === "draft" && (
                  <Button onClick={() => setPendingAction("submit")}>
                    <Send className="h-4 w-4" />
                    Submit untuk Approval
                  </Button>
                )}
                {voucher.status === "draft" && isOwnVoucher && (
                  <Button variant="outline" asChild>
                    <Link href={editPath}>
                      <Pencil className="h-4 w-4" />
                      Edit PV
                    </Link>
                  </Button>
                )}
                {voucher.status === "submitted" && canApprove && (
                  <>
                    <Button onClick={() => setPendingAction("approve")}>
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => setPendingAction("reject")}>
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {voucher.status === "submitted" && !canApprove && (
                  <p className="text-sm text-muted-foreground">
                    Menunggu approval dari user yang punya izin Approve/Reject (kamu tidak punya izin ini).
                  </p>
                )}
                {voucher.status === "rejected" && isOwnVoucher && (
                  <Button variant="outline" asChild>
                    <Link href={editPath}>
                      <Pencil className="h-4 w-4" />
                      Edit & Ajukan Ulang
                    </Link>
                  </Button>
                )}
                {voucher.status === "rejected" && !isOwnVoucher && (
                  <p className="text-sm text-muted-foreground">
                    PV ini ditolak - cuma pembuatnya yang bisa mengedit & mengajukannya ulang.
                  </p>
                )}
                {["approved", "paid"].includes(voucher.status) && (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada aksi approval yang tersedia untuk status ini.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="space-y-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                {voucher.direction === "out" && (
                  <>
                    <div>
                      <dt className="text-xs text-muted-foreground">Metode Pembayaran</dt>
                      <dd className="text-sm font-medium">{paymentMethodLabel[voucher.paymentMethod]}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{labels.receiverBank}</dt>
                      <dd className="text-sm font-medium">{voucher.receiverBankName || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{labels.receiverAccountName}</dt>
                      <dd className="text-sm font-medium">{voucher.receiverAccountName || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{labels.receiverAccountNumber}</dt>
                      <dd className="text-sm font-medium">{voucher.receiverAccountNumber || "-"}</dd>
                    </div>
                  </>
                )}
                <div>
                  <dt className="text-xs text-muted-foreground">Dibayarkan oleh</dt>
                  <dd className="text-sm font-medium">{voucher.paidBy ?? "Belum dibayar"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Total Dibayarkan</dt>
                  <dd className="text-sm font-medium">{formatCurrency(voucher.totalAmount)}</dd>
                </div>
              </dl>

              {voucher.status === "approved" && !canPay && (
                <p className="text-sm text-muted-foreground">
                  Menunggu staff yang punya izin pembayaran (kamu tidak punya izin ini).
                </p>
              )}
              {voucher.status === "paid" && (
                <p className="text-sm text-success">Payment Voucher ini sudah dibayar.</p>
              )}
              {["approved", "paid"].includes(voucher.status) && canPay && (
                <div className="space-y-2">
                  <Label htmlFor="paymentProof">Bukti Pembayaran</Label>
                  <div className="flex gap-2">
                    <label
                      htmlFor="paymentProof"
                      className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent"
                    >
                      <Paperclip className="h-4 w-4" />
                      {paymentProofInput?.name || "Pilih file bukti transfer/pembayaran (JPG, PNG, atau PDF)"}
                    </label>
                    <input
                      id="paymentProof"
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      className="hidden"
                      onChange={handlePaymentProofChange}
                    />
                    {voucher.status === "paid" && (
                      <Button
                        type="button"
                        variant="outline"
                        isLoading={uploadPaymentProof.isPending}
                        disabled={!paymentProofInput || uploadPaymentProofFile.isPending}
                        onClick={() =>
                          paymentProofInput &&
                          uploadPaymentProof.mutate({
                            paymentProofFileName: paymentProofInput.name,
                            paymentProofUrls: paymentProofInput.urls,
                          })
                        }
                      >
                        <Save className="h-4 w-4" />
                        Simpan
                      </Button>
                    )}
                  </div>
                  <FilePreviewThumbnails urls={paymentProofPreviewUrls} altPrefix="Preview bukti pembayaran" />
                </div>
              )}
              {voucher.status === "approved" && canPay && (
                <Button onClick={() => setPendingAction("pay")}>
                  <Wallet className="h-4 w-4" />
                  Tandai Sudah Dibayar
                </Button>
              )}
              {["draft", "submitted", "rejected"].includes(voucher.status) && (
                <p className="text-sm text-muted-foreground">
                  Menunggu approval sebelum bisa ditandai dibayar.
                </p>
              )}
            </div>
          )}

          {activeTab === "tax" && (
            <div className="space-y-4">
              {voucher.status === "paid" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxInvoiceNumber">Faktur Pajak</Label>
                    <Input
                      id="taxInvoiceNumber"
                      placeholder="010.000-26.00000001"
                      value={taxInvoiceInput}
                      onChange={(e) => setTaxInvoiceInput(e.target.value)}
                      disabled={!canPay}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxProof">Bukti Pajak</Label>
                    <label
                      htmlFor="taxProof"
                      className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-input bg-background px-3 text-sm text-muted-foreground hover:bg-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
                      aria-disabled={!canPay}
                    >
                      <Paperclip className="h-4 w-4" />
                      {taxProofInput?.name || "Pilih file Faktur Pajak/bukti pajak (JPG, PNG, atau PDF)"}
                    </label>
                    <input
                      id="taxProof"
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      className="hidden"
                      disabled={!canPay}
                      onChange={handleTaxProofChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Kalau PDF, semua halamannya ikut ditampilkan & ke-print.
                    </p>
                    <FilePreviewThumbnails urls={taxProofPreviewUrls} altPrefix="Preview bukti pajak" />
                  </div>
                  {canPay && (
                    <Button
                      type="button"
                      variant="outline"
                      isLoading={updateTaxInvoice.isPending}
                      disabled={uploadTaxProofFile.isPending}
                      onClick={() =>
                        updateTaxInvoice.mutate({
                          taxInvoiceNumber: taxInvoiceInput,
                          taxProofFileName: taxProofInput?.name ?? null,
                          taxProofUrls: taxProofInput?.urls ?? null,
                        })
                      }
                    >
                      <Save className="h-4 w-4" />
                      Simpan
                    </Button>
                  )}
                  {!canPay && (
                    <p className="text-xs text-muted-foreground">
                      Kamu tidak punya izin buat mengisi Faktur Pajak.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">Faktur Pajak</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Belum bisa diisi - Faktur Pajak baru bisa dimasukkan setelah Payment Voucher ini
                    berstatus Dibayar.
                  </p>
                </div>
              )}

              <div className="space-y-1 rounded-[10px] border border-border bg-secondary/40 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(voucher.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">+ PPN ({voucher.ppnPercent}%)</span>
                  <span className="text-destructive">{formatCurrency(voucher.ppnAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">- PPh 23 ({voucher.pphJasaPercent}%)</span>
                  <span className="text-destructive">{formatCurrency(voucher.pphJasaAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">- PPh 21 ({voucher.pphFreelancePercent}%)</span>
                  <span className="text-destructive">{formatCurrency(voucher.pphFreelanceAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(voucher.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              {voucher.history.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
              )}
              <ol className="space-y-4 border-l border-border pl-4">
                {voucher.history.map((entry, index) => (
                  <li key={index} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="text-sm font-medium">{historyStatusLabel[entry.status]}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.by} · {formatDateTime(entry.at)}
                    </p>
                    {entry.note && <p className="mt-1 text-xs text-muted-foreground">Catatan: {entry.note}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
            setRejectNoteInput("");
          }
        }}
        title={pendingAction ? actionConfig[pendingAction].title : ""}
        description={pendingAction ? actionConfig[pendingAction].description : ""}
        confirmLabel={pendingAction ? actionConfig[pendingAction].confirmLabel : ""}
        isLoading={isActionPending}
        confirmDisabled={pendingAction === "reject" && rejectNoteInput.trim().length === 0}
        onConfirm={() => {
          if (!pendingAction) return;
          actionConfig[pendingAction].run();
          setPendingAction(null);
          setRejectNoteInput("");
        }}
      >
        {pendingAction === "reject" && (
          <div className="space-y-1.5">
            <Label htmlFor="rejectNote">Alasan Penolakan</Label>
            <Textarea
              id="rejectNote"
              placeholder="Contoh: Dokumen pendukung kurang lengkap"
              value={rejectNoteInput}
              onChange={(e) => setRejectNoteInput(e.target.value)}
            />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
