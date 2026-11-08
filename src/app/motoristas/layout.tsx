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

/* Metadados próprios: nada herdado do site de clientes (palavras-chave de transfer, título do Twitter).
   Na comunicação de recrutamento falamos sempre dos três aeroportos: Lisboa, Porto e Faro. */
const TITULO = "Candidatura de motoristas | HUB Transfer";
const DESCRICAO = "Candidaturas abertas para motoristas de transfer nos aeroportos de Lisboa, Porto e Faro. Preenche a ficha em poucos minutos.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  keywords: null,
  alternates: { canonical: "/motoristas" },
  twitter: { card: "summary", title: TITULO, description: DESCRICAO },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
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
