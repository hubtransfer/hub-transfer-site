import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import ConsentimentoPixel from "./_components/ConsentimentoPixel";
import "./inverno.css";

/* Campanha de inverno (recrutamento de motoristas): identidade do filme — Barlow + amarelo HUB.
   Tudo o que está aqui vive só nesta rota; o resto do site não muda. */

const barlow = Barlow({
  subsets: ["latin"],
  variable: "--inv-font-text",
  display: "swap",
  weight: ["400", "600"],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--inv-font-display",
  display: "swap",
  weight: ["800"],
});

export const metadata: Metadata = {
  title: "Motoristas para o inverno | HUB Transfer",
  description:
    "No inverno, a dinâmica vai embora. As viagens marcadas, não. A HUB Transfer está a formar a equipa de motoristas para o inverno.",
  alternates: { canonical: "/inverno" },
  openGraph: {
    title: "No inverno, a dinâmica vai embora. As viagens marcadas, não.",
    description: "A HUB Transfer está a formar a equipa de motoristas para o inverno.",
    url: "/inverno",
    siteName: "HUB Transfer",
    locale: "pt_PT",
    type: "website",
    images: [{ url: "/inverno/filme-capa.webp", width: 540, height: 960 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function InvernoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`inv ${barlow.variable} ${barlowCondensed.variable}`}>
      {children}
      <ConsentimentoPixel />
    </div>
  );
}
