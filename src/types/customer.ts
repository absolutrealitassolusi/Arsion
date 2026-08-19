export type CustomerStatus = "active" | "inactive";

export interface Customer {
  id: string;
  name: string;
  code: string;
  npwp: string;
  email: string;
  phone?: string;
  address: string;
  status: CustomerStatus;
  updatedAt: string;
}

export type CustomerPayload = Omit<Customer, "id" | "status" | "updatedAt">;

export interface CustomerListResponse {
  data: Customer[];
  total: number;
}

export interface CustomerDetailResponse {
  data: Customer;
}
