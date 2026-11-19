import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Os guias em PDF apontam para o endereço antigo (com #p-1 … #p-21; o browser mantém a âncora).
      { source: "/monte-a-sua-lisboa", destination: "/lisboa", permanent: true },
    ];
  },
};

export default nextConfig;
