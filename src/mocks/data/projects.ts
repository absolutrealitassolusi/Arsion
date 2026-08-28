import type { Project } from "@/types/project";

export const dummyProjects: Project[] = [
  {
    id: "PRJ-0001",
    name: "Renovasi Gudang Cakung",
    code: "RGC-001",
    description: "Renovasi total gudang penyimpanan di area Cakung.",
    clientName: "PT Sumber Makmur",
    picName: "Budi Santoso",
    startDate: "2026-06-01T00:00:00.000Z",
    status: "ongoing",
    updatedAt: "2026-07-20T09:00:00.000Z",
  },
  {
    id: "PRJ-0002",
    name: "Instalasi Listrik Pabrik Baru",
    code: "ILP-002",
    description: "Instalasi jaringan listrik untuk unit produksi baru.",
    clientName: "CV Cipta Karya",
    picName: "Sari Wulandari",
    startDate: "2026-03-15T00:00:00.000Z",
    endDate: "2026-07-01T00:00:00.000Z",
    status: "completed",
    updatedAt: "2026-07-18T09:00:00.000Z",
  },
  {
    id: "PRJ-0003",
    name: "Pengadaan Furnitur Kantor",
    code: "PFK-003",
    description: "Pengadaan meja, kursi, dan lemari untuk kantor pusat.",
    clientName: "PT Anugrah Jaya",
    picName: "Dina Ramadhani",
    startDate: "2026-08-01T00:00:00.000Z",
    status: "on_hold",
    updatedAt: "2026-07-15T09:00:00.000Z",
  },
];
