import type { User } from "@/types/user";

/**
 * Contoh tanda tangan dummy (SVG data URL) - cuma buat mendemonstrasikan
 * state "sudah ada tanda tangan" di UI. Upload sungguhan lewat form akan
 * menghasilkan data URL dari file PNG/JPG asli, bukan SVG seperti ini.
 */
const sampleSignatureDataUrl =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100" viewBox="0 0 240 100">` +
      `<path d="M10 70 C 30 20, 50 20, 60 50 S 90 90, 105 55 S 130 15, 150 55 S 175 85, 190 50 S 210 25, 230 45" ` +
      `fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />` +
      `</svg>`
  );

export const dummyUsers: User[] = [
  {
    id: "USR-0001",
    name: "Dina Pratiwi",
    email: "dina.pratiwi@arsion.app",
    department: "Finance",
    position: "Staff",
    roles: ["Admin"],
    status: "active",
    lastLogin: "2026-07-28T08:12:00.000Z",
    updatedAt: "2026-07-25T09:00:00.000Z",
    signatureUrl: null,
    signatureFileName: null,
    signatureUpdatedAt: null,
  },
  {
    id: "USR-0002",
    name: "Budi Santoso",
    email: "budi.santoso@arsion.app",
    department: "IT",
    position: "Manager",
    roles: ["Admin"],
    status: "active",
    lastLogin: "2026-07-29T07:45:00.000Z",
    updatedAt: "2026-07-24T09:00:00.000Z",
    signatureUrl: sampleSignatureDataUrl,
    signatureFileName: "ttd-budi-santoso.png",
    signatureUpdatedAt: "2026-07-24T09:00:00.000Z",
  },
  {
    id: "USR-0003",
    name: "Sari Wulandari",
    email: "sari.wulandari@arsion.app",
    department: "Finance",
    position: "Supervisor",
    roles: ["Manager"],
    status: "inactive",
    lastLogin: null,
    updatedAt: "2026-07-20T09:00:00.000Z",
    signatureUrl: null,
    signatureFileName: null,
    signatureUpdatedAt: null,
  },
  {
    id: "USR-0004",
    name: "Nabila",
    email: "nabila@arsion.app",
    department: "Finance",
    position: "Staff",
    roles: ["Staff Finance", "GA Officer"],
    status: "active",
    lastLogin: "2026-07-27T13:30:00.000Z",
    updatedAt: "2026-07-27T13:30:00.000Z",
    signatureUrl: null,
    signatureFileName: null,
    signatureUpdatedAt: null,
  },
];
