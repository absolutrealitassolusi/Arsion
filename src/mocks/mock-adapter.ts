import MockAdapter from "axios-mock-adapter";
import { api } from "@/lib/axios";

/**
 * Dummy/mock API layer - dipertahankan sebagai titik pemasangan kalau nanti
 * ada modul baru yang butuh di-mock sebelum backend aslinya siap.
 *
 * Auth, User, Role, Vendor, Customer, Payment Voucher, dan Notifications
 * SEMUANYA sudah punya backend asli (lihat src/app/api/) - makanya tidak
 * ada lagi handler terdaftar di sini. `onNoMatch: "passthrough"` penting
 * dipertahankan supaya kalau ada modul baru yang belum di-mock, request-nya
 * tetap keluar ke jaringan (nyampe ke Route Handler asli) alih-alih kena
 * reject 404 sama axios-mock-adapter.
 */
export function setupMockApi(): void {
  new MockAdapter(api, { delayResponse: 600, onNoMatch: "passthrough" });
}
