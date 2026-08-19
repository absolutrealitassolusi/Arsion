# Status Backend

Checklist hidup, di-update tiap kali ada modul yang pindah dari mock ke backend asli. Terakhir dicek: 19 Agustus 2026.

## Sudah backend asli (Drizzle ORM + Postgres, lewat `src/app/api/...`)

| Modul | Endpoint |
|---|---|
| Auth - login/logout/session sekarang lewat **Supabase Auth** (bukan JWT/bcrypt sendiri lagi, sejak 19 Agustus 2026 - lihat memory `supabase-auth-migration-incident`), self-service edit nama/email di "Profil Saya" lewat `PATCH /auth/me`. Role/permission tetap 100% punya app sendiri (tabel `Role`/`_UserRoles`), Supabase cuma megang identitas+password. "Ganti Password" (pas udah login) beneran jalan. "Lupa Password" kodenya juga udah manggil Supabase asli (bukan simulasi lagi) - tapi **belum bisa dites penuh** karena email seed (`@arsion.app`) domain dummy yang ditolak Supabase pas mau kirim email beneran (`email_address_invalid`) - perlu email domain asli buat verifikasi ujung-ke-ujung. | `src/app/api/auth/*` |
| User Management (CRUD, aktivasi, tanda tangan) | `src/app/api/users/*` |
| Role Management (CRUD, permission) | `src/app/api/roles/*` |
| Master Data > Vendor (CRUD) | `src/app/api/vendors/*` |
| Master Data > Customer (CRUD) | `src/app/api/customers/*` |
| Payment Voucher (create, edit PV Draft/Ditolak lewat `PUT`, submit, approve, reject, tandai dibayar, Faktur Pajak, bukti pembayaran/pajak) - tiap transisi status juga otomatis bikin notifikasi baru (lihat `src/lib/transition-payment-voucher.ts`) | `src/app/api/payment-vouchers/*` |
| Notifications (ikon lonceng di navbar) | `src/app/api/notifications/*` |
| Master Data > Company (singleton - 1 row, form Nama/Alamat/NPWP/Telepon/Email) - datanya juga dipakai kop surat cetak PV (lihat `payment-voucher-print.tsx`) | `src/app/api/company/*` |
| Log Aktivitas (read-only, dicatat otomatis dari aksi sistem - Login, PV create/edit/hapus/submit/approve/reject/pay, User/Role/Vendor/Customer create/edit/hapus, aktivasi User, edit Company) lewat `src/lib/activity-log.ts`'s `logActivity()` | `src/app/api/activity-logs/*` |

Route protection (middleware + redirect) juga sudah aktif untuk semua halaman `(dashboard)`.

`src/mocks/mock-adapter.ts` sekarang gak ada handler terdaftar sama sekali (cuma nyisain `onNoMatch: "passthrough"` sebagai titik pemasangan buat modul baru nanti) - semua modul yang tadinya di-mock udah pindah ke backend asli.

## Masih mock (`axios-mock-adapter`, data di memori browser - reset tiap reload halaman)

Tidak ada lagi - lihat catatan di bawah "Belum ada backend SAMA SEKALI" buat modul yang MEMANG belum digarap (beda dari "masih mock", itu belum pernah jadi modul CRUD sama sekali).

## Belum ada backend SAMA SEKALI (bukan cuma mock CRUD - datanya statis/hardcode)

Tidak ada lagi - Log Aktivitas (yang terakhir tersisa) sudah jadi backend asli 19 Agustus 2026 (lihat tabel di atas).

Catatan: **Reports** (Voucher/Tax/Cash Flow), **Archive**, dan sekarang **Dashboard** (lihat `src/components/modules/dashboard/dashboard-overview.tsx`) sudah otomatis ikut kebenerin begitu Payment Voucher pindah ke backend asli - semuanya cuma narik dari `usePaymentVouchers()`, gak perlu kerjaan terpisah.

Catatan definisi angka Dashboard (interpretasi, bukan hasil diskusi eksplisit tiap istilah - kalau beda dari yang dimaksud, gampang diubah di `dashboard-overview.tsx`):
- "Invoice Belum Lunas" = total PV **Out** berstatus `approved` (udah disetujui, belum ditandai dibayar).
- "Total Pembayaran Bulan Ini" = total PV berstatus `paid` yang `updatedAt`-nya jatuh di bulan berjalan (proxy dari kapan PV ditandai dibayar, bukan field "paidAt" terpisah).
- Belum ada badge trend ("▲ 5,4% dari bulan lalu") - itu butuh query data periode sebelumnya juga, sengaja belum digarap biar scope-nya tetap kecil & angka yang ditampilkan gak ada yang direka-reka lagi.

## Sengaja ditunda (keputusan sebelumnya, bukan kelupaan)

- **Reset password lewat email** - masih simulasi toast, belum ada layanan email asli (Resend/SendGrid/dll).
- **Rate-limiting / lockout login** - belum ada proteksi brute-force di endpoint login.

## File upload asli (Supabase Storage) - kode selesai 18 Agustus 2026, nunggu kredensial

Lampiran PV, Bukti Pembayaran, Bukti Pajak, dan Tanda Tangan User sekarang upload ke **Supabase Storage** (private bucket `pv-files` + signed URL, TTL 5 menit) lewat 2 endpoint generik: `POST /api/uploads` (upload) dan `POST /api/files/resolve-urls` (resolve path jadi signed URL, otorisasi `requireUser()` sebelum signed URL dibuat). Lib intinya `src/lib/file-storage.ts` (server-only, service role key) + `src/lib/file-path.ts` (fungsi murni, aman diimpor client - `isRemotePath()`/`validateFile()`). Validasi: maks 5MB, JPG/PNG saja.

**Kompatibel penuh dengan data lama** - kolom `attachmentUrls`/`paymentProofUrls`/`taxProofUrls`/`User.signatureUrl` TIDAK berubah tipe (masih `text[]`/`text`), isinya sekarang bisa data URL base64 lama (dipakai apa adanya) ATAU path Storage baru (di-resolve ke signed URL) - dibedakan lewat prefix `data:`. Gak ada migrasi data.

**Signature snapshot** (nutup catatan arsitektur lama di `types/user.ts`) juga sudah diimplementasi - `PaymentVoucher` punya 3 kolom baru (`preparedSignatureSnapshot`/`approvedSignatureSnapshot`/`paidSignatureSnapshot`), disalin dari `User.signatureUrl` PERSIS di momen create/edit (Dibuat), approve (Disetujui), pay (Dibayarkan). PV yang di-approve SEBELUM fitur ini ada tetap fallback ke lookup-live-by-name (kolom snapshotnya `null`) - gak bisa direkonstruksi retroaktif, tapi PV baru sekarang gak akan pernah salah nampilin tanda tangan lagi walau user gonta-ganti TTD-nya.

**Yang masih perlu dilakukan sebelum ini beneran jalan (bukan bug, murni nunggu aksi manual):**
1. Isi `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` di `.env` (lihat `.env.example` buat instruksi ambil dari Supabase Dashboard).
2. Jalankan `npm run storage:setup` sekali (bikin bucket private-nya, idempotent).

Sebelum itu diisi, upload file baru bakal gagal dengan pesan jelas ("Supabase Storage belum dikonfigurasi...") - bukan crash, dan semua fitur LAIN (termasuk lihat PV lama yang masih base64) tetap jalan normal.

## Infrastruktur

- **Database sekarang Supabase** (project `ozvtcwawpgqhjrbyghgb`, region `ap-northeast-2`) - sudah gak pakai Postgres lokal lagi.
- **ORM-nya Drizzle** (`src/db/schema.ts` + `src/lib/db.ts`, driver `drizzle-orm/node-postgres` lewat `pg`) - **bukan Prisma lagi**, dimigrasi total tanggal 13 Agustus 2026 karena Prisma 7.9.1 punya masalah performa parah (query ORM biasa butuh 5-10+ detik, kadang sampai 100+ detik - root cause-nya Prisma 7 buang total binary query engine, ganti WASM yang lambat di setup ini). Detail lengkap diagnosa & migrasinya ada di memory `prisma-7-slow-query-engine`. Gak ada lagi `prisma/`, `generated/prisma/`, atau paket `@prisma/*` di project ini.
- **`DATABASE_URL` di `.env` pakai direct connection (port 5432)**, BUKAN connection pooler (port 6543/`pgbouncer=true`). Alasannya (peninggalan era Prisma, kemungkinan besar masih relevan buat Drizzle juga karena driver `pg` default-nya juga pakai prepared statement): pas dicoba lewat pooler dulu, `prisma db push` error `"prepared statement already exists"` - pgbouncer transaction-mode gak cocok sama prepared statement. Untuk local dev (1 proses Node, bukan serverless) ini gak masalah. **Perlu diinget** pas deploy ke Vercel (serverless) - kemungkinan perlu pindah ke Supabase session-mode pooler atau driver `postgres.js` dengan `{ prepare: false }` kalau error serupa muncul lagi, belum ditest ulang buat Drizzle secara spesifik.
- Skema Postgres-nya gak berubah dari sebelumnya (tabel udah ada duluan dari era `prisma db push`) - migrasi ke Drizzle murni migrasi kode aplikasi, `src/db/schema.ts` cuma mendeskripsikan tabel yang udah ada, gak ada migrasi data. Belum ada migration history resmi (Drizzle atau lainnya) buat skema yang aktif sekarang - kalau butuh nanti, `drizzle-kit` udah terpasang (dipakai `drizzle.config.ts` kalau ada, atau introspeksi manual).
- Password database Supabase ada di `.env` (`DATABASE_URL`) - file itu sudah di-gitignore.
- **Testing** sudah lengkap 3 lapis:
  - **Vitest (logic/API)** - `npm run test` / `npm run test:watch` - 120 test di 18 file: logic hitungan pajak PV (`calculatePvTotals`), terbilang Rupiah, skema nomor PV, validasi Zod (payment voucher, vendor, company), Route Handler API (transisi status PV + notifikasi otomatis + signature snapshot, create & edit PV, list vendor, get/update company, self-service update profil, upload & resolve-urls file Storage). **Route handler yang nyentuh DB sekarang jadi integration test lawan DB dev Supabase asli** (bukan mock lagi - query builder Drizzle gak bisa di-mock rapi kayak Prisma dulu), data test dikasih prefix unik & dibersihin otomatis abis tiap test (cleanup berdasarkan ID persis yang di-capture pas seeding, BUKAN pattern-match kolom yang bisa dipakai bareng file test lain - lihat memory `pv-list-select-star-attachments`). Endpoint yang manggil Supabase Storage (`/api/uploads`, `/api/files/resolve-urls`) di-mock di boundary SDK-nya (`@supabase/supabase-js`) - beda kasus dari DB sendiri, ini SDK eksternal. Detail konvensinya di memory `testing-setup`.
  - **Component test (Vitest + React Testing Library)** - file `*.test.tsx`, jsdom environment (opt-in per file lewat `// @vitest-environment jsdom`) - nyakup `FilePreviewThumbnails`, `Combobox`, `ConfirmDialog`.
  - **E2E (Playwright)** - `npm run test:e2e` - 6 test di `e2e/`, jalan di browser Chromium beneran lawan dev server & database dev asli (BUKAN DB test terpisah): login sukses/gagal, route protection, alur PV penuh (buat→ajukan→approve→bayar, otomatis bersihin data yang dibikin), permission gating (user tanpa `pv.approve` gak lihat tombol Approve/Reject). **Sengaja `workers: 1`** (jalan satu-satu) - direct connection ke Supabase kewalahan kalau ke-hit barengan dari banyak worker, request-nya nggantung sampai timeout.
  - Ini representative coverage (modul PV paling dalam, modul lain buat breadth), bukan cakupan penuh semua modul/route.
- Project belum jadi git repo, belum pernah di-deploy kemanapun.
- **Catatan performa (13 Agustus 2026, update 18 Agustus 2026):** query sederhana sekarang balik ke ~100ms (sesuai target). `SELECT *` di tabel PaymentVoucher masih ~5-7 detik murni karena volume data (lampiran/bukti pembayaran disimpan base64 langsung di kolom - lihat poin "File upload asli" di bawah), bukan soal ORM/query engine lagi. **List endpoint `GET /api/payment-vouchers`** (dipakai tabel, worklist, archive, reports, dashboard) sudah dibenerin 18 Agustus 2026 - sekarang cuma select kolom yang kepake, gak ikut narik 3 kolom base64 itu (~0.3 detik). Halaman **detail** PV (`GET /api/payment-vouchers/[id]`) masih select semua kolom termasuk base64-nya - itu memang butuh datanya, jadi tetap kena biaya penuh kalau lampirannya berat. Fix permanen buat kasus itu tetap nunggu "File upload asli" (pindah ke blob storage) di bawah.
