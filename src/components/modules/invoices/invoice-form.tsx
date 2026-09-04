"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { FormField } from "@/components/shared/form-field";
import { invoiceSchema, type InvoiceFormValues } from "@/schemas/invoice.schema";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { calculateInvoiceTotals, type Invoice, type InvoicePayload } from "@/types/invoice";
import { formatCurrency } from "@/lib/utils";

const emptyItem = { description: "", qty: 1, unitPrice: 0 };

interface InvoiceFormProps {
  /** Kalau diisi, form ini jadi mode edit - cuma boleh buat Invoice berstatus Draft (lihat PUT /api/invoices/[id]). */
  editInvoice?: Invoice;
}

export function InvoiceForm({ editInvoice }: InvoiceFormProps) {
  const router = useRouter();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice(editInvoice?.id ?? "");

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: editInvoice
      ? {
          customerName: editInvoice.customerName,
          date: editInvoice.date,
          dueDate: editInvoice.dueDate,
          items: editInvoice.items,
          ppnPercent: editInvoice.ppnPercent,
          notes: editInvoice.notes,
        }
      : {
          customerName: "",
          date: new Date().toISOString().slice(0, 10),
          dueDate: new Date().toISOString().slice(0, 10),
          items: [emptyItem],
          ppnPercent: 11,
          notes: "",
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const totals = calculateInvoiceTotals(
    items.map((i) => ({ ...i, qty: Number(i.qty) || 0, unitPrice: Number(i.unitPrice) || 0 })),
    Number(watch("ppnPercent")) || 0
  );

  const buildPayload = (values: InvoiceFormValues): InvoicePayload => ({
    ...values,
    notes: values.notes || null,
  });

  const onSubmit = (values: InvoiceFormValues) => {
    if (editInvoice) {
      updateInvoice.mutate(buildPayload(values), {
        onSuccess: () => router.push(`/finance/invoice/${editInvoice.id}`),
      });
      return;
    }
    createInvoice.mutate(buildPayload(values), {
      onSuccess: () => router.push("/finance/invoice"),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Invoice</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Nomor Invoice</Label>
            <Input id="invoiceNumber" value="Otomatis dibuat setelah disimpan" disabled />
          </div>

          <FormField
            id="customerName"
            label="Nama Customer"
            placeholder="PT Sumber Makmur"
            error={errors.customerName?.message}
            {...register("customerName")}
          />

          <FormField id="date" label="Tanggal" type="date" error={errors.date?.message} {...register("date")} />
          <FormField
            id="dueDate"
            label="Jatuh Tempo"
            type="date"
            error={errors.dueDate?.message}
            {...register("dueDate")}
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
                        <Input type="number" min={0} className="pl-8" {...register(`items.${index}.unitPrice`)} />
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
                <Input type="number" min={0} max={100} className="h-8 w-16" {...register("ppnPercent")} />
                <span className="text-muted-foreground">%</span>
              </div>
              <span className="w-40 text-right">{formatCurrency(totals.ppnAmount)}</span>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="w-40 text-right text-primary">{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>

          <FormField
            id="notes"
            label="Catatan (Opsional)"
            placeholder="Contoh: Pembayaran ditransfer ke rekening perusahaan"
            error={errors.notes?.message}
            {...register("notes")}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(editInvoice ? `/finance/invoice/${editInvoice.id}` : "/finance/invoice")}
        >
          Batal
        </Button>
        <Button type="submit" isLoading={editInvoice ? updateInvoice.isPending : createInvoice.isPending}>
          <Save className="h-4 w-4" />
          {editInvoice ? "Simpan Perubahan" : "Simpan sebagai Draft"}
        </Button>
      </div>
    </form>
  );
}
