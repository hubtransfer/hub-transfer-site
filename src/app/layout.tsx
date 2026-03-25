import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HUB Transfer — Transfer and Tourism",
  description:
    "Premium airport transfer service in Lisbon. Luxury transportation between airport, hotels, and tourist destinations.",
  keywords: [
    "transfer",
    "airport",
    "Lisbon",
    "Lisboa",
    "tourism",
    "luxury transport",
    "hotel transfer",
  ],
  authors: [{ name: "HUB Transfer" }],
  openGraph: {
    title: "HUB Transfer — Transfer and Tourism",
    description:
      "Premium airport transfer service in Lisbon. Luxury transportation between airport, hotels, and tourist destinations.",
    siteName: "HUB Transfer",
    locale: "pt_PT",
    type: "website",
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
      className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
