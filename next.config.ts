import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sistema com dados dinâmicos (agenda, pedidos): não usamos "cache components".
  images: { formats: ["image/webp"] },
};

export default nextConfig;
