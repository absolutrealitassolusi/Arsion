import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Matiin indikator dev bawaan Next.js (ikon petir pojok kiri bawah) -
  // suka ikut kefoto/ke-print kalau lagi preview halaman.
  devIndicators: false,
};

export default nextConfig;
