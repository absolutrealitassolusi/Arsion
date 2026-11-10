"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Package, Plus, Save, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { FormField } from "@/components/shared/form-field";
import {
  paymentVoucherSchema,
  todayInJakarta,
  type PaymentVoucherFormValues,
} from "@/schemas/payment-voucher.schema";
import {
  useCreatePaymentVoucher,
  useUpdatePaymentVoucher,
  usePvNumberPreview,
  paymentVoucherKeys,
} from "@/hooks/use-payment-vouchers";
import { paymentVoucherService } from "@/services/payment-voucher.service";
import { useVendors, useCreateVendor } from "@/hooks/use-vendors";
import { useCustomers, useCreateCustomer } from "@/hooks/use-customers";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCompany } from "@/hooks/use-company";
import { DEFAULT_COMPANY_BANKS } from "@/schemas/company.schema";
import {
  calculatePvTotals,
  ITEM_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
  type ItemCategory,
  type PvDirection,
  type PaymentVoucher,
  type PaymentVoucherPayload,
} from "@/types/payment-voucher";
import { formatCurrency } from "@/lib/utils";
import { getErrorMessage, type ApiErrorShape } from "@/lib/axios";
import { MultiFileUpload } from "@/components/modules/payment-vouchers/multi-file-upload";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const emptyItem = { category: "barang" as ItemCategory, description: "", qty: 1, unitPrice: 0 };

type RateField = "ppnPercent" | "pphJasaPercent" | "pphFreelancePercent";

/** Tarif default yang diisi otomatis kalau ada item yang kena pajaknya (PPN 11%, PPh 23 2%, PPh 21 5%). */
const DEFAULT_RATES: Record<RateField, number> = { ppnPercent: 11, pphJasaPercent: 2, pphFreelancePercent: 5 };

/** Dasar pengenaan pajak per jenis - aturannya sama dengan calculatePvTotals. */
function taxBases(items: { category: ItemCategory; qty: number | string; unitPrice: number | string }[]) {
  const amount = (i: (typeof items)[number]) => (Number(i.qty) || 0) * (Number(i.unitPrice) || 0);
  const sumOf = (pred: (c: ItemCategory) => boolean) =>
    items.filter((i) => pred(i.category)).reduce((s, i) => s + amount(i), 0);
  return {
    ppn: sumOf((c) => c !== "non_pajak"),
    jasa: sumOf((c) => c === "jasa"),
    freelance: sumOf((c) => c === "freelance"),
  };
}

interface PaymentVoucherFormProps {
  direction: PvDirection;
  /**
   * Kalau diisi, form ini jadi mode edit (bukan bikin baru) - dipakai buat
   * PV berstatus Draft atau Ditolak yang mau diedit & diajukan ulang (lihat
   * PUT /api/payment-vouchers/[id]). Cuma pembuat PV-nya sendiri yang boleh,
   * dicek di server juga, bukan cuma disembunyikan di UI.
   */
  editVoucher?: PaymentVoucher;
}

export function PaymentVoucherForm({ direction, editVoucher }: PaymentVoucherFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createVoucher = useCreatePaymentVoucher();
  const updateVoucher = useUpdatePaymentVoucher(editVoucher?.id ?? "");
  const currentUser = useCurrentUser();
  const basePath = direction === "in" ? "/finance/pv/pv-in" : "/finance/pv/pv-out";
  const [isSubmittingForApproval, setIsSubmittingForApproval] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const { data: vendorsData } = useVendors();
  const { data: customersData } = useCustomers();
  const createVendor = useCreateVendor();
  const createCustomer = useCreateCustomer();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<PaymentVoucherFormValues>({
    resolver: zodResolver(paymentVoucherSchema),
    defaultValues: editVoucher
      ? {
          direction: editVoucher.direction,
          date: editVoucher.date,
          senderBank: editVoucher.senderBank,
          partyName: editVoucher.partyName,
          description: editVoucher.description,
          items: editVoucher.items,
          ppnPercent: editVoucher.ppnPercent,
          pphJasaPercent: editVoucher.pphJasaPercent,
          pphFreelancePercent: editVoucher.pphFreelancePercent,
          paymentMethod: editVoucher.paymentMethod,
          receiverBankName: editVoucher.receiverBankName,
          receiverAccountName: editVoucher.receiverAccountName,
          receiverAccountNumber: editVoucher.receiverAccountNumber,
          projectNumber: editVoucher.projectNumber ?? "",
          poNumber: editVoucher.poNumber ?? "",
          invoiceNumber: editVoucher.invoiceNumber ?? "",
          taxInvoiceNumber: editVoucher.taxInvoiceNumber ?? "",
          attachments: editVoucher.attachments,
        }
      : {
          direction,
          date: todayInJakarta(),
          senderBank: "",
          partyName: "",
          description: "",
          items: [emptyItem],
          // Default tarif umum (PPN 11%, PPh 23 2%, PPh 21 5%) supaya staff gak
          // perlu apal/cari tarif tiap bikin PV - tetap bisa diketik ulang kalau
          // aturan pajak berubah, tanpa perlu ubah kode.
          ppnPercent: 11,
          pphJasaPercent: 2,
          pphFreelancePercent: 5,
          paymentMethod: "transfer",
          receiverBankName: "",
          receiverAccountName: "",
          receiverAccountNumber: "",
          projectNumber: "",
          poNumber: "",
          invoiceNumber: "",
          taxInvoiceNumber: "",
          attachments: [],
        },
  });

  // Pilihan bank dari Master Data > Company. Bank yang sudah tersimpan di PV
  // lama tetap ditampilkan walau sudah dihapus dari daftar, biar edit PV
  // lama gak tiba-tiba kehilangan isian bank-nya.
  const { data: companyData } = useCompany();
  const companyBanks = companyData?.data?.banks ?? DEFAULT_COMPANY_BANKS;
  const savedSenderBank = editVoucher?.senderBank;
  const senderBankOptions =
    savedSenderBank && !companyBanks.includes(savedSenderBank) ? [...companyBanks, savedSenderBank] : companyBanks;

  const selectedDate = watch("date");
  const numberPreview = usePvNumberPreview(selectedDate, !editVoucher);
  // Mode edit: nomor sudah final sejak PV pertama dibuat, gak pernah
  // digenerate ulang walau tanggalnya diubah.
  const voucherNumberDisplay = editVoucher
    ? editVoucher.voucherNumber
    : numberPreview.data
      ? `${numberPreview.data.data.voucherNumber} (perkiraan)`
      : numberPreview.isFetching
        ? "Menghitung..."
        : "Otomatis dibuat setelah disimpan";

  const partyOptions =
    direction === "out"
      ? vendorsData?.data.map((v) => v.name) ?? []
      : customersData?.data.map((c) => c.name) ?? [];

  // Istilah rekening kebalik arahnya tergantung direction: PV Out kita yang
  // kirim (Bank Pengirim) ke rekening Vendor yang nerima (Bank Penerima).
  // PV In kebalikannya: rekening kita yang nerima, rekening Customer yang kirim.
  const labels =
    direction === "out"
      ? {
          party: "Dibayarkan Kepada",
          partyKind: "vendor",
          senderBank: "Bank Pengirim",
          receiverBank: "Bank Penerima (Vendor)",
          receiverAccountName: "Nama Rekening Bank",
          receiverAccountNumber: "Nomor Akun Penerima",
        }
      : {
          party: "Diterima Dari",
          partyKind: "customer",
          senderBank: "Bank Penerima (Kita)",
          receiverBank: "Bank Pengirim (Customer)",
          receiverAccountName: "Nama Rekening Pengirim",
          receiverAccountNumber: "Nomor Rekening Pengirim",
        };

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const rates = {
    ppnPercent: Number(watch("ppnPercent")) || 0,
    pphJasaPercent: Number(watch("pphJasaPercent")) || 0,
    pphFreelancePercent: Number(watch("pphFreelancePercent")) || 0,
  };
  const numericItems = items.map((i) => ({ ...i, qty: Number(i.qty) || 0, unitPrice: Number(i.unitPrice) || 0 }));
  const totals = calculatePvTotals(numericItems, rates);
  const bases = taxBases(numericItems);

  // Tarif pajak otomatis ikut item (port dari SiPV): ada item kena PPN ->
  // PPN default, ada item Jasa -> PPh 23 default, ada Freelance -> PPh 21
  // default; kalau item-nya gak ada, tarifnya 0. Berhenti otomatis begitu
  // user ngubah tarif itu manual (mis. vendor non-PKP atau bebas PPh). Mode
  // edit: tarif yang sudah tersimpan gak diutak-atik.
  const rateTouched = useRef<Record<RateField, boolean>>({
    ppnPercent: Boolean(editVoucher),
    pphJasaPercent: Boolean(editVoucher),
    pphFreelancePercent: Boolean(editVoucher),
  });
  const hasPpnBase = bases.ppn > 0;
  const hasJasa = bases.jasa > 0;
  const hasFreelance = bases.freelance > 0;
  useEffect(() => {
    const wanted: Record<RateField, number> = {
      ppnPercent: hasPpnBase ? DEFAULT_RATES.ppnPercent : 0,
      pphJasaPercent: hasJasa ? DEFAULT_RATES.pphJasaPercent : 0,
      pphFreelancePercent: hasFreelance ? DEFAULT_RATES.pphFreelancePercent : 0,
    };
    (Object.keys(wanted) as RateField[]).forEach((field) => {
      if (!rateTouched.current[field] && Number(getValues(field)) !== wanted[field]) {
        setValue(field, wanted[field]);
      }
    });
  }, [hasPpnBase, hasJasa, hasFreelance, getValues, setValue]);
  const markRateTouched = (field: RateField) => () => {
    rateTouched.current[field] = true;
  };

  // Ada item kena PPN tapi PPN 0% -> tanya dulu sebelum simpan (bisa lupa
  // isi, bisa juga memang vendor non-PKP) - sama kayak SiPV.
  const [pendingPpnConfirm, setPendingPpnConfirm] = useState<{ run: () => void } | null>(null);
  const guardPpnZero = (values: PaymentVoucherFormValues, run: () => void) => {
    if (taxBases(values.items).ppn > 0 && Number(values.ppnPercent) === 0) {
      setPendingPpnConfirm({ run });
      return;
    }
    run();
  };

  const handleSelectParty = (name: string) => {
    setValue("partyName", name, { shouldValidate: true });
    // Rekening vendor (penerima) diisi otomatis buat PV Out. PV In sengaja
    // gak ada field rekening - uang masuk dari luar, rekening pengirimnya
    // biasanya gak diketahui. Yang kosong di master data gak nimpa isian.
    if (direction !== "out") return;
    const matched = vendorsData?.data.find((v) => v.name === name);
    if (matched) {
      if (matched.bankName) setValue("receiverBankName", matched.bankName);
      if (matched.bankAccountNumber) setValue("receiverAccountNumber", matched.bankAccountNumber);
      if (matched.bankAccountName) setValue("receiverAccountName", matched.bankAccountName);
    }
  };

  // Tambah cepat dari form PV: kode dikosongkan biar diisi otomatis server
  // (dulu dikirim "-" tetap, jadi tambah cepat kedua selalu gagal "kode sudah
  // dipakai"). Data lain dilengkapi belakangan lewat Edit di Master Data.
  const handleCreateParty = (name: string) => {
    if (direction === "out") {
      createVendor.mutate({
        name,
        code: "",
        npwp: "",
        address: "",
        bankName: "",
        bankAccountNumber: "",
        bankAccountName: name,
      });
    } else {
      createCustomer.mutate({
        name,
        code: "",
        npwp: "",
        email: "",
        address: "",
        bankName: "",
        bankAccountNumber: "",
        bankAccountName: "",
      });
    }
  };

  const buildPayload = (values: PaymentVoucherFormValues): PaymentVoucherPayload => ({
    ...values,
    receiverBankName: values.receiverBankName ?? "",
    receiverAccountName: values.receiverAccountName ?? "",
    receiverAccountNumber: values.receiverAccountNumber ?? "",
    projectNumber: values.projectNumber || null,
    poNumber: values.poNumber || null,
    invoiceNumber: values.invoiceNumber || null,
    taxInvoiceNumber: values.taxInvoiceNumber || null,
    attachments: values.attachments ?? [],
  });

  /**
   * Simpan sebagai Draft (bikin baru) atau simpan perubahan (edit) - bisa
   * dilanjut/diedit lagi nanti sebelum diajukan. Abis sukses selalu balik
   * ke halaman daftar PV (bukan nyangkut di detail), biar alurnya "isi
   * form -> balik liat daftar" - penting terutama pas nginput banyak PV
   * berturut-turut.
   */
  const onSaveDraft = (values: PaymentVoucherFormValues) => {
    if (editVoucher) {
      updateVoucher.mutate(buildPayload(values), {
        onSuccess: () => router.push(basePath),
      });
      return;
    }
    createVoucher.mutate(buildPayload(values), {
      onSuccess: () => router.push(basePath),
    });
  };

  /**
   * Bikin PV (atau simpan perubahan kalau lagi edit) lalu langsung ajukan
   * untuk approval, dalam 1 klik - daripada user harus bikin/edit dulu, lalu
   * cari lagi vouchernya, baru ketemu tombol "Submit" yang kesembunyi di tab
   * Approval. Dipisah dari `useCreatePaymentVoucher()`/`useUpdatePaymentVoucher()`
   * (yang toast-nya bilang "sebagai Draft") supaya cuma ada 1 toast yang
   * akurat, bukan 2 toast yang saling kontradiksi.
   */
  const onSubmitForApproval = async (values: PaymentVoucherFormValues) => {
    setIsSubmittingForApproval(true);
    try {
      const id = editVoucher
        ? (await paymentVoucherService.update(editVoucher.id, buildPayload(values))).data.id
        : (await paymentVoucherService.create(buildPayload(values))).data.id;
      await paymentVoucherService.submit(id);
      toast.success(
        editVoucher
          ? "Perubahan disimpan dan Payment Voucher diajukan ulang untuk approval"
          : "Payment Voucher berhasil dibuat dan diajukan untuk approval"
      );
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.all });
      router.push(basePath);
    } catch (err) {
      const apiError = err as ApiErrorShape;
      toast.error(apiError.message ?? "Gagal mengajukan Payment Voucher");
    } finally {
      setIsSubmittingForApproval(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit((values) => guardPpnZero(values, () => onSaveDraft(values)))}
      className="space-y-6 pb-24"
    >
      <Card>
        <CardHeader>
          <CardTitle>Informasi Voucher</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="senderBank">{labels.senderBank}</Label>
            <Select
              onValueChange={(value) => setValue("senderBank", value, { shouldValidate: true })}
              value={watch("senderBank")}
            >
              <SelectTrigger id="senderBank">
                <SelectValue placeholder="Pilih Bank" />
              </SelectTrigger>
              <SelectContent>
                {senderBankOptions.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.senderBank && <p className="text-xs text-destructive">{errors.senderBank.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucherNumber">Nomor PV</Label>
            <Input id="voucherNumber" value={voucherNumberDisplay} disabled />
            {!editVoucher && numberPreview.data && (
              <p className="text-xs text-muted-foreground">
                Nomor final ditentukan saat disimpan - bisa bergeser kalau ada PV lain yang disimpan duluan.
              </p>
            )}
          </div>

          <FormField
            id="projectNumber"
            label="Nomor Project (Opsional)"
            placeholder="Contoh: PRJ-2026-001"
            error={errors.projectNumber?.message}
            {...register("projectNumber")}
          />

          <FormField
            id="date"
            label="Tanggal"
            type="date"
            max={todayInJakarta()}
            error={errors.date?.message}
            {...register("date")}
          />

          <div className="space-y-2">
            <Label htmlFor="partyName">{labels.party}</Label>
            <Combobox
              id="partyName"
              value={watch("partyName")}
              onChange={handleSelectParty}
              options={partyOptions}
              onCreateOption={handleCreateParty}
              createLabel={(v) => `+ Tambah "${v}" sebagai ${labels.partyKind} baru`}
              placeholder={direction === "out" ? "Ketik nama vendor..." : "Ketik nama customer..."}
            />
            {errors.partyName && <p className="text-xs text-destructive">{errors.partyName.message}</p>}
          </div>

          {direction === "out" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                <Select
                  onValueChange={(value) => setValue("paymentMethod", value as PaymentVoucherFormValues["paymentMethod"])}
                  value={watch("paymentMethod")}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                      <SelectItem key={method} value={method}>
                        {PAYMENT_METHOD_LABELS[method]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FormField
                id="receiverBankName"
                label={labels.receiverBank}
                placeholder="BCA / Mandiri / BNI / dll"
                error={errors.receiverBankName?.message}
                {...register("receiverBankName")}
              />

              <FormField
                id="receiverAccountName"
                label={labels.receiverAccountName}
                placeholder="Nama pemilik rekening"
                error={errors.receiverAccountName?.message}
                {...register("receiverAccountName")}
              />

              <div className="sm:col-span-2">
                <FormField
                  id="receiverAccountNumber"
                  label={labels.receiverAccountNumber}
                  placeholder="1234-5678-9012"
                  error={errors.receiverAccountNumber?.message}
                  {...register("receiverAccountNumber")}
                />
              </div>
            </>
          )}

          <FormField
            id="poNumber"
            label="Nomor PO (Opsional)"
            placeholder="PO-2026-001"
            error={errors.poNumber?.message}
            {...register("poNumber")}
          />

          <FormField
            id="invoiceNumber"
            label="Nomor Invoice (Opsional)"
            placeholder="INV-2026-001"
            error={errors.invoiceNumber?.message}
            {...register("invoiceNumber")}
          />

          <FormField
            id="taxInvoiceNumber"
            label="Faktur Pajak (Opsional)"
            placeholder="010.000-26.00000001"
            error={errors.taxInvoiceNumber?.message}
            {...register("taxInvoiceNumber")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Rincian Item
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => append(emptyItem)}>
            <Plus className="h-4 w-4" />
            Tambah Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead className="w-40">Item</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-36">Harga Satuan</TableHead>
                <TableHead className="w-32 text-right">Jumlah</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const item = items[index];
                const rowAmount = (Number(item?.qty) || 0) * (Number(item?.unitPrice) || 0);
                return (
                  <TableRow key={field.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) =>
                          setValue(`items.${index}.category`, value as ItemCategory)
                        }
                        value={watch(`items.${index}.category`)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ITEM_CATEGORY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Keterangan item..." {...register(`items.${index}.description`)} />
                      {errors.items?.[index]?.description && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.items[index]?.description?.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input type="number" min={1} {...register(`items.${index}.qty`)} />
                    </TableCell>
                    <TableCell>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          type="number"
                          min={0}
                          className="pl-8"
                          {...register(`items.${index}.unitPrice`)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(rowAmount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {errors.items && !Array.isArray(errors.items) && (
            <p className="text-xs text-destructive">{errors.items.message}</p>
          )}

          <div className="ml-auto w-full space-y-3 rounded-[10px] bg-secondary/40 p-4 text-sm sm:max-w-md">
            <div className="flex items-center justify-end gap-4">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="w-40 text-right">{formatCurrency(totals.subtotal)}</span>
            </div>

            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">+ PPN</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="h-8 w-16"
                  {...register("ppnPercent", { onChange: markRateTouched("ppnPercent") })}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <span className="w-40 text-right">{formatCurrency(totals.ppnAmount)}</span>
            </div>

            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">- PPh 23</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="h-8 w-16"
                  {...register("pphJasaPercent", { onChange: markRateTouched("pphJasaPercent") })}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <span className="w-40 text-right">{formatCurrency(totals.pphJasaAmount)}</span>
            </div>

            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">- PPh 21</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="h-8 w-16"
                  {...register("pphFreelancePercent", { onChange: markRateTouched("pphFreelancePercent") })}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <span className="w-40 text-right">{formatCurrency(totals.pphFreelanceAmount)}</span>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="w-40 text-right text-primary">{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>

          <FormField
            id="description"
            label="Keterangan"
            placeholder="Contoh: Pembayaran invoice #INV-2231"
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="space-y-2">
            <Label htmlFor="attachment">Lampiran (Opsional)</Label>
            <p className="text-xs text-muted-foreground">
              Bisa pilih beberapa file sekaligus (JPG, PNG, atau PDF). Kalau PDF, semua halamannya ikut
              ditampilkan & ke-print.
            </p>
            <MultiFileUpload
              id="attachment"
              files={watch("attachments") ?? []}
              onChange={(files) => setValue("attachments", files, { shouldValidate: true })}
              kind="pv-attachment"
              placeholder="Tambah file invoice/bukti (JPG, PNG, atau PDF)"
              altPrefix="Preview lampiran"
              onUploadingChange={setIsUploadingAttachment}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tanda Tangan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Dibayarkan</Label>
              <Input value="Belum dibayar" disabled />
            </div>
            <div className="space-y-2">
              <Label>Disetujui</Label>
              <Input value="Belum disetujui" disabled />
            </div>
            <div className="space-y-2">
              <Label>Dibuat</Label>
              <Input value={currentUser.name} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={editVoucher?.status === "rejected" ? "destructive" : "secondary"}>
              {editVoucher?.status === "rejected" ? "Ditolak" : "Draft"}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              {editVoucher
                ? "Pilih salah satu aksi di bawah: simpan perubahan sebagai Draft dulu, atau langsung ajukan ulang untuk approval sekarang."
                : "Pilih salah satu aksi di bawah: simpan sebagai Draft dulu (bisa diedit lagi nanti), atau langsung ajukan untuk approval sekarang."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sticky di bawah viewport supaya tetap kepencet tanpa scroll ke
          paling bawah, terutama pas item-nya banyak dan form jadi panjang. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(editVoucher ? `${basePath}/${editVoucher.id}` : basePath)}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="outline"
          isLoading={editVoucher ? updateVoucher.isPending : createVoucher.isPending}
          disabled={isSubmittingForApproval || isUploadingAttachment}
        >
          <Save className="h-4 w-4" />
          {editVoucher ? "Simpan Perubahan" : "Simpan sebagai Draft"}
        </Button>
        <Button
          type="button"
          isLoading={isSubmittingForApproval}
          disabled={(editVoucher ? updateVoucher.isPending : createVoucher.isPending) || isUploadingAttachment}
          onClick={handleSubmit((values) => guardPpnZero(values, () => void onSubmitForApproval(values)))}
        >
          <Send className="h-4 w-4" />
          {editVoucher ? "Ajukan Ulang untuk Approval" : "Ajukan untuk Approval"}
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingPpnConfirm)}
        onOpenChange={(open) => !open && setPendingPpnConfirm(null)}
        title="PPN masih 0%"
        description={`Ada item kena pajak (DPP ${formatCurrency(bases.ppn)}) tapi PPN 0%. Lanjut simpan tanpa PPN (misalnya vendor non-PKP)? Pilih Batal untuk mengisi PPN dulu.`}
        confirmLabel="Ya, tanpa PPN"
        onConfirm={() => {
          pendingPpnConfirm?.run();
          setPendingPpnConfirm(null);
        }}
      />
    </form>
  );
}
