import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Dancing_Script } from "next/font/google";
import "@/styles/globals.css";

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

const SITE_URL = "https://hub-transfer-site.vercel.app";

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
      "Monitorização de voo em tempo real. Seu motorista já está lá quando você desembarca. Preço fixo, sem surpresas.",
    images: [{ url: "/images/mercedes.png", width: 1200, height: 630 }],
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
    images: ["/images/mercedes.png"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TransportationService",
              name: "HUB Transfer",
              description:
                "Transfer privado no Aeroporto de Lisboa com monitorização de voo em tempo real",
              url: SITE_URL,
              logo: `${SITE_URL}/images/logo.png`,
              telephone: "+351968698138",
              email: "juniorguitierez@hubtransferencia.com",
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
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "4387",
                bestRating: "5",
              },
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
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
