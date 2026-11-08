import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Dancing_Script } from "next/font/google";
import "@/styles/globals.css";
import DadosEstruturados from "./_dados-estruturados";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-cursive",
  display: "swap",
  weight: ["700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = "https://hubtransfer.pt";

export const metadata: Metadata = {
  title: "Transfer Aeroporto Lisboa | Motorista à Sua Espera | HUB Transfer",
  description:
    "Transfer privado no Aeroporto de Lisboa com monitorização de voo em tempo real. Preço fixo, motorista sempre pontual, cancelamento grátis. Reserve em 2 minutos.",
  keywords: [
    "transfer aeroporto lisboa",
    "transporte privado lisboa",
    "shuttle aeroporto lisboa",
    "transfer hotel lisboa",
    "motorista aeroporto",
    "taxi aeroporto lisboa preço fixo",
    "transfer sintra",
    "transfer cascais",
    "transfer fátima",
  ],
  authors: [{ name: "HUB Transfer" }],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Transfer Aeroporto Lisboa | HUB Transfer",
    description:
      "Monitorização de voo em tempo real. O seu motorista já lá está quando desembarca. Preço fixo, sem surpresas.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    url: SITE_URL,
    siteName: "HUB Transfer",
    locale: "pt_PT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transfer Aeroporto Lisboa | HUB Transfer",
    description:
      "Monitorização de voo em tempo real. Motorista sempre pontual.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable} ${dancingScript.variable}`}
      suppressHydrationWarning
    >
      <head>
        <DadosEstruturados />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
