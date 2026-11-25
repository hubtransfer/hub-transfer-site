/* Título, descrição, imagem de partilha e as cinco línguas para os motores de busca (x-default = inglês, /lisboa). */

import type { Metadata, Viewport } from "next";
import { PRATOS, pratoPorSlug } from "./pratos";
import { ROTAS, TEXTOS, rotaPrato } from "./textos";
import { LINGUAS, type Lingua } from "./tipos";

/** hreflang de cada língua (o português é o de Portugal). */
export const HREFLANG: Record<Lingua, string> = { en: "en", pt: "pt-PT", es: "es", fr: "fr", it: "it" };

/** en, pt-PT, es, fr, it e x-default (inglês) para um endereço. */
export function alternativas(rota: (l: Lingua) => string): Record<string, string> {
  const a: Record<string, string> = {};
  for (const l of LINGUAS) a[HREFLANG[l]] = rota(l);
  a["x-default"] = rota("en");
  return a;
}

export function metadadosLisboa(lingua: Lingua): Metadata {
  const t = TEXTOS[lingua];
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: {
      canonical: ROTAS[lingua],
      languages: alternativas((l) => ROTAS[l]),
    },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDesc,
      url: ROTAS[lingua],
      siteName: "HUB Transfer",
      locale: t.ogLocale,
      alternateLocale: LINGUAS.filter((l) => l !== lingua).map((l) => TEXTOS[l].ogLocale),
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

// viewportFit cover: a barra de baixo e as margens usam a zona segura do iPhone (env(safe-area-inset-*)).
export const viewportLisboa: Viewport = { themeColor: "#111110", viewportFit: "cover" };

const TITULO_PRATO: Record<Lingua, string> = {
  pt: "{d} em Lisboa: reservamos a sua mesa sem custo | HUB Transfer",
  en: "{d} in Lisbon: we book your table free of charge | HUB Transfer",
  es: "{d} en Lisboa: reservamos su mesa sin coste | HUB Transfer",
  // tradução por rever
  fr: "{d} à Lisbonne : nous réservons votre table sans frais | HUB Transfer",
  it: "{d} a Lisbona: prenotiamo il suo tavolo senza costi | HUB Transfer",
};

/** Os 8 pratos, para gerar as páginas no build. */
export const paramsPratos = () => PRATOS.map((p) => ({ prato: p.slug }));

export function metadadosPrato(lingua: Lingua, slug: string): Metadata {
  const prato = pratoPorSlug(slug);
  if (!prato) return {};
  const [nome, frase] = prato[lingua];
  const title = TITULO_PRATO[lingua].replace("{d}", nome);
  const description = `${frase} ${prato.sobre[lingua][0]}`;
  const imagem = `/lisboa/pratos/prato-${String(prato.n).padStart(2, "0")}-a.jpg`;
  return {
    title,
    description,
    alternates: {
      canonical: rotaPrato(lingua, slug),
      languages: alternativas((l) => rotaPrato(l, slug)),
    },
    openGraph: {
      title,
      description,
      url: rotaPrato(lingua, slug),
      siteName: "HUB Transfer",
      locale: TEXTOS[lingua].ogLocale,
      type: "website",
      images: [{ url: imagem, width: 1600, height: 1067, alt: nome }],
    },
    twitter: { card: "summary_large_image", title, description, images: [imagem] },
  };
}
