export interface Company {
  id: string;
  name: string;
  address: string;
  npwp: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type CompanyPayload = Omit<Company, "id" | "createdAt" | "updatedAt">;

export interface CompanyResponse {
  /** Null kalau belum pernah diisi sama sekali (belum ke-seed/belum disimpan). */
  data: Company | null;
}
