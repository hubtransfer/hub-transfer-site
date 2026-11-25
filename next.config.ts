import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF primeiro (mais leve), WebP como reserva. 60 = miniaturas dos cartões de /lisboa; 75 = o normal do site.
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
  },
  async redirects() {
    return [
      // Os guias em PDF portugueses apontam para o endereço antigo (com #p-1 … #p-21; o browser mantém a âncora).
      { source: "/monte-a-sua-lisboa", destination: "/pt/lisboa", permanent: true },
      // O inglês passou a ser a língua principal da /lisboa (E7): /en/lisboa → /lisboa.
      { source: "/en/lisboa", destination: "/lisboa", permanent: true },
      { source: "/en/lisboa/prato/:prato", destination: "/lisboa/prato/:prato", permanent: true },
    ];
  },
};

export default nextConfig;
