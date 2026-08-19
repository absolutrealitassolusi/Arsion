export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  /** Nama Role (bisa lebih dari satu) - lihat types/role.ts untuk daftar Role & permission-nya. */
  roles: string[];
  status: UserStatus;
  /** null = belum pernah login. */
  lastLogin: string | null;
  updatedAt: string;

  /**
   * Tanda tangan digital user (PNG/JPG) - disimpan sebagai data URL karena
   * masih mock, belum ada file storage asli. Dipakai antara lain buat
   * approval Payment Voucher.
   *
   * Catatan arsitektur untuk nanti: pas user approve sebuah PV, sistem
   * seharusnya menyalin (snapshot) tanda tangan ini ke dalam record approval
   * itu sendiri, bukan cuma nge-refer ke sini - supaya kalau tanda tangan
   * user diganti di kemudian hari, dokumen historis yang sudah di-approve
   * tidak ikut berubah. Belum diimplementasikan di sesi ini.
   */
  signatureUrl: string | null;
  signatureFileName: string | null;
  signatureUpdatedAt: string | null;
}

export type UserPayload = Omit<
  User,
  "id" | "updatedAt" | "lastLogin" | "signatureUrl" | "signatureFileName" | "signatureUpdatedAt"
>;

/** Khusus create - user baru butuh password awal yang di-set admin. */
export type CreateUserPayload = UserPayload & { password: string };

export interface UserListResponse {
  data: User[];
  total: number;
}

export interface UserDetailResponse {
  data: User;
}
