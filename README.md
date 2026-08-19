# NexaERP – Enterprise ERP Frontend

Frontend ERP modern dibangun dengan Next.js 15 (App Router), React 19, TypeScript,
Tailwind CSS, shadcn/ui, TanStack Query, Axios, React Hook Form, dan Zod.

## Tech Stack

| Layer            | Teknologi                         |
|-------------------|-----------------------------------|
| Framework         | Next.js 15 (App Router)           |
| UI Library        | React 19 + TypeScript (strict)    |
| Styling           | Tailwind CSS + shadcn/ui          |
| Icons             | Lucide React                      |
| Data Fetching     | TanStack Query + Axios            |
| Forms             | React Hook Form + Zod             |
| Notifications     | Sonner (toast)                    |
| Theming           | next-themes (dark mode support)   |

## Getting Started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Buka http://localhost:3000 — akan otomatis redirect ke `/dashboard`.

## Dummy / Mock API

Karena backend belum tersedia, project ini menggunakan **axios-mock-adapter**
(`src/mocks/mock-adapter.ts`) yang mensimulasikan endpoint REST sungguhan
(`GET/POST/PUT/DELETE /products`) lengkap dengan delay response 600ms
agar loading state & skeleton terlihat realistis.

Ketika backend asli sudah siap:
1. Set `NEXT_PUBLIC_USE_MOCK_API=false` di `.env.local`
2. Set `NEXT_PUBLIC_API_BASE_URL` ke URL backend
3. **Tidak ada perubahan kode** di `services/` maupun `hooks/` — karena
   kontrak request/response sudah disamakan dengan mock.

## Folder Structure

```
src/
├── app/                      # Routing (App Router)
│   ├── (auth)/login          # Halaman login
│   └── (dashboard)/          # Shell dashboard (sidebar + topbar)
│       ├── dashboard/        # KPI overview
│       └── products/         # Modul produk (list + create)
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── layout/                # Sidebar, Topbar, ThemeToggle
│   ├── shared/                # PageHeader, StatCard, TableSkeleton
│   └── modules/products/      # Komponen spesifik modul produk
├── hooks/                     # TanStack Query hooks (data fetching)
├── services/                  # Axios API service layer
├── schemas/                   # Zod validation schemas
├── types/                     # TypeScript types/interfaces
├── mocks/                     # Dummy data + mock API adapter
└── lib/                       # axios instance, query client, utils (cn)
```

## Design Tokens

- Background: `#F8F9FA` (light) — dark mode otomatis mengikuti class `dark`
- Primary: `#2563EB`
- Radius: `12px` (card/besar), `10px` (input/button), `8px` (elemen kecil)
- Shadow: halus (`shadow-subtle`, `shadow-card`)

## Menambah Modul Baru

Pola yang dipakai pada modul **Products** bisa direplikasi untuk modul lain
(Inventory, Customers, Invoices, dst):

1. `types/<module>.ts` — definisikan interface data
2. `schemas/<module>.schema.ts` — Zod schema untuk form
3. `services/<module>.service.ts` — fungsi Axios (getAll, getById, create, update, remove)
4. `hooks/use-<module>.ts` — TanStack Query hooks
5. `mocks/data/<module>.ts` + tambahkan handler di `mocks/mock-adapter.ts`
6. `components/modules/<module>/` — table & form komponen
7. `app/(dashboard)/<module>/page.tsx` — halaman list & create
