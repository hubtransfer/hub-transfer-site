import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "CRM da assistente — HUB Transfer",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function LayoutAssistente({ children }: { children: React.ReactNode }) {
  return children;
}
