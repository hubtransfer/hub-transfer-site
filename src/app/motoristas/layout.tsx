import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import ConsentimentoPixel from "./_components/ConsentimentoPixel";
import "./motoristas.css";

/* /motoristas — candidatura de motoristas, versão clara (protótipo docs/motoristas/motoristas-prototipo-claro.html).
   Sempre clara, mesmo com o telemóvel em modo escuro. Tudo o que está aqui vive só nesta rota. */

const barlow = Barlow({
  subsets: ["latin"],
  variable: "--mot-font-texto",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--mot-font-display",
  display: "swap",
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Candidatura de motoristas | HUB Transfer",
  description:
    "Estamos a escolher os próximos motoristas da HUB Transfer. Transfers entre o aeroporto de Lisboa e hotéis, com viagens marcadas com antecedência.",
  alternates: { canonical: "/motoristas" },
  openGraph: {
    title: "Estamos a escolher os próximos motoristas da HUB Transfer.",
    description: "Lemos cada candidatura. Os perfis escolhidos são chamados para uma entrevista.",
    url: "/motoristas",
    siteName: "HUB Transfer",
    locale: "pt_PT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function MotoristasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`mot ${barlow.variable} ${barlowCondensed.variable}`}>
      {children}
      <ConsentimentoPixel />
    </div>
  );
}
