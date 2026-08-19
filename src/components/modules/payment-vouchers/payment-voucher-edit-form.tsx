"use client";

import { Card, CardContent } from "@/components/ui/card";
import { usePaymentVoucher } from "@/hooks/use-payment-vouchers";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PaymentVoucherForm } from "@/components/modules/payment-vouchers/payment-voucher-form";
import type { PvDirection } from "@/types/payment-voucher";

interface PaymentVoucherEditFormProps {
  voucherId: string;
  direction: PvDirection;
}

/**
 * Ambil data PV dulu baru render `PaymentVoucherForm` dalam mode edit -
 * defaultValues form itu di-set sekali pas mount, jadi harus nunggu data
 * asli kebaca dulu (bukan lewat `values` reaktif kayak ProfileForm, biar
 * gak perlu ubah struktur form yang udah ada). Status & kepemilikan dicek
 * di sini juga (bukan cuma di server) supaya user langsung liat pesan yang
 * jelas kalau nyoba akses lewat URL langsung tanpa lewat tombol Edit.
 */
export function PaymentVoucherEditForm({ voucherId, direction }: PaymentVoucherEditFormProps) {
  const { data, isLoading } = usePaymentVoucher(voucherId);
  const currentUser = useCurrentUser();
  const voucher = data?.data;

  if (isLoading || !voucher) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Memuat data Payment Voucher...
        </CardContent>
      </Card>
    );
  }

  if (!["draft", "rejected"].includes(voucher.status)) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Cuma Payment Voucher berstatus Draft atau Ditolak yang bisa diedit.
        </CardContent>
      </Card>
    );
  }

  if (voucher.preparedBy !== currentUser.name) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Cuma pembuat Payment Voucher ini yang bisa mengeditnya.
        </CardContent>
      </Card>
    );
  }

  return <PaymentVoucherForm direction={direction} editVoucher={voucher} />;
}
