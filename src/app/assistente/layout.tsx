import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./assistente.css";

/* /assistente — CRM da assistente (E21: tema claro, da mesma família de /motoristas e /lisboa).
   Sempre claro, mesmo com o telemóvel em modo escuro. */

const barlow = Barlow({ subsets: ["latin"], variable: "--crm-font-texto", display: "swap", weight: ["400", "500", "600", "700"] });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], variable: "--crm-font-display", display: "swap", weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: "CRM da assistente — HUB Transfer",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  themeColor: "#F1F2F4",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function LayoutAssistente({ children }: { children: React.ReactNode }) {
  return <div className={`${barlow.variable} ${barlowCondensed.variable}`}>{children}</div>;
}
