import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF primeiro (mais leve), WebP como reserva. 60 = miniaturas dos cartões de /lisboa; 75 = o normal do site.
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
  },
  async redirects() {
    return [
      // Os guias em PDF apontam para o endereço antigo (com #p-1 … #p-21; o browser mantém a âncora).
      { source: "/monte-a-sua-lisboa", destination: "/lisboa", permanent: true },
    ];
  },
};

export default nextConfig;
