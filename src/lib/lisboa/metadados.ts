/* Título, descrição, imagem de partilha e as três línguas para os motores de busca. */

import type { Metadata, Viewport } from "next";
import { ROTAS, TEXTOS } from "./textos";
import type { Lingua } from "./tipos";

export function metadadosLisboa(lingua: Lingua): Metadata {
  const t = TEXTOS[lingua];
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: {
      canonical: ROTAS[lingua],
      languages: {
        "pt-PT": ROTAS.pt,
        en: ROTAS.en,
        es: ROTAS.es,
        "x-default": ROTAS.en,
      },
    },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDesc,
      url: ROTAS[lingua],
      siteName: "HUB Transfer",
      locale: t.ogLocale,
      alternateLocale: (["pt", "en", "es"] as const).filter((l) => l !== lingua).map((l) => TEXTOS[l].ogLocale),
      type: "website",
      images: [{ url: "/lisboa/hero/hero-mesa-a.jpg", width: 2400, height: 1350, alt: t.titleA + t.titleEm + t.titleB }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.metaTitle,
      description: t.metaDesc,
      images: ["/lisboa/hero/hero-mesa-a.jpg"],
    },
  };
}

export const viewportLisboa: Viewport = { themeColor: "#111110" };
