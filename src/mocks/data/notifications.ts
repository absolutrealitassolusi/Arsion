import type { Notification } from "@/types/notification";

export const dummyNotifications: Notification[] = [
  {
    id: "NTF-001",
    title: "Stok menipis",
    description: "Wireless Mechanical Keyboard tersisa 0 unit.",
    type: "warning",
    isRead: false,
    createdAt: "2026-07-20T07:15:00.000Z",
  },
  {
    id: "NTF-002",
    title: "Invoice baru dibayar",
    description: "Invoice INV-2026-0412 telah lunas.",
    type: "success",
    isRead: false,
    createdAt: "2026-07-20T05:40:00.000Z",
  },
  {
    id: "NTF-003",
    title: "Pelanggan baru terdaftar",
    description: "PT Solusi Digital Nusantara baru saja mendaftar.",
    type: "info",
    isRead: true,
    createdAt: "2026-07-19T14:05:00.000Z",
  },
];
