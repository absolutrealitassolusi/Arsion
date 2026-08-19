import type { Customer } from "@/types/customer";

export const dummyCustomers: Customer[] = [
  {
    id: "CUST-0001",
    name: "PT Maju Bersama",
    code: "MB-001",
    npwp: "11.234.567.8-901.000",
    email: "finance@majubersama.co.id",
    phone: "021-7771234",
    address: "Jl. Sudirman No. 45, Jakarta Selatan",
    status: "active",
    updatedAt: "2026-07-21T09:00:00.000Z",
  },
  {
    id: "CUST-0002",
    name: "CV Karya Sejahtera",
    code: "KS-002",
    npwp: "12.345.678.9-012.000",
    email: "ap@karyasejahtera.co.id",
    phone: "021-7772345",
    address: "Jl. Gatot Subroto No. 12, Jakarta Selatan",
    status: "active",
    updatedAt: "2026-07-19T09:00:00.000Z",
  },
  {
    id: "CUST-0003",
    name: "PT Cahaya Abadi",
    code: "CA-003",
    npwp: "13.456.789.0-123.000",
    email: "billing@cahayaabadi.co.id",
    phone: "021-7773456",
    address: "Jl. Rasuna Said No. 8, Jakarta Selatan",
    status: "inactive",
    updatedAt: "2026-07-14T09:00:00.000Z",
  },
];
