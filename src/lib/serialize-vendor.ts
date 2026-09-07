import type { Vendor as ApiVendor, VendorStatus } from "@/types/vendor";

interface PrismaVendor {
  id: string;
  name: string;
  npwp: string;
  phone: string | null;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: VendorStatus;
  updatedAt: Date;
}

export function serializeVendor(vendor: PrismaVendor): ApiVendor {
  return {
    id: vendor.id,
    name: vendor.name,
    // Primary key = code (lihat src/db/schema.ts) - dua field API ini sengaja
    // selalu identik, dipertahankan terpisah biar frontend gak perlu berubah.
    code: vendor.id,
    npwp: vendor.npwp,
    phone: vendor.phone ?? undefined,
    address: vendor.address,
    bankName: vendor.bankName,
    bankAccountNumber: vendor.bankAccountNumber,
    bankAccountName: vendor.bankAccountName,
    status: vendor.status,
    updatedAt: vendor.updatedAt.toISOString(),
  };
}
