import type { Company as ApiCompany } from "@/types/company";

interface PrismaCompany {
  id: string;
  name: string;
  address: string;
  npwp: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeCompany(company: PrismaCompany): ApiCompany {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
    npwp: company.npwp,
    phone: company.phone,
    email: company.email,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}
