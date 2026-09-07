import type { Customer as ApiCustomer, CustomerStatus } from "@/types/customer";

interface PrismaCustomer {
  id: string;
  name: string;
  npwp: string;
  email: string;
  phone: string | null;
  address: string;
  status: CustomerStatus;
  updatedAt: Date;
}

export function serializeCustomer(customer: PrismaCustomer): ApiCustomer {
  return {
    id: customer.id,
    name: customer.name,
    // Primary key = code (lihat src/db/schema.ts) - dua field API ini sengaja
    // selalu identik, dipertahankan terpisah biar frontend gak perlu berubah.
    code: customer.id,
    npwp: customer.npwp,
    email: customer.email,
    phone: customer.phone ?? undefined,
    address: customer.address,
    status: customer.status,
    updatedAt: customer.updatedAt.toISOString(),
  };
}
