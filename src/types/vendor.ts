export type VendorStatus = "active" | "inactive";

export interface Vendor {
  id: string;
  name: string;
  code: string;
  npwp: string;
  phone?: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  status: VendorStatus;
  updatedAt: string;
}

export type VendorPayload = Omit<Vendor, "id" | "status" | "updatedAt">;

export interface VendorListResponse {
  data: Vendor[];
  total: number;
}

export interface VendorDetailResponse {
  data: Vendor;
}
