"use client";

import { usePathname } from "next/navigation";

const SITE_URL = "https://hubtransfer.pt";

/* Dados estruturados (schema.org) do site, no <head> de todas as páginas — exceto a candidatura de motoristas
   (/motoristas), que não mostra nenhum número de telefone, nem escondido. O conteúdo é o mesmo que estava no layout. */
const DADOS = {
  "@context": "https://schema.org",
  "@type": "TransportationService",
  name: "HUB Transfer",
  description:
    "Transfer privado no Aeroporto de Lisboa com monitorização de voo em tempo real",
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo.png`,
  telephone: "+351968698138",
  email: "contacto@hubtransfer.pt",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Amadora",
    addressRegion: "Lisboa",
    addressCountry: "PT",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 38.7223,
    longitude: -9.1393,
  },
  areaServed: { "@type": "City", name: "Lisboa" },
  priceRange: "€€",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday", "Tuesday", "Wednesday", "Thursday",
      "Friday", "Saturday", "Sunday",
    ],
    opens: "00:00",
    closes: "23:59",
  },
  sameAs: [
    "https://www.facebook.com/hubtransfer",
    "https://www.instagram.com/hubtransfer",
  ],
};

export default function DadosEstruturados() {
  const caminho = usePathname();
  if (caminho === "/motoristas" || caminho?.startsWith("/motoristas/")) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DADOS) }} />;
}
