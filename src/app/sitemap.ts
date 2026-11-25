import type { MetadataRoute } from "next";
import { alternativas } from "@/lib/lisboa/metadados";
import { PRATOS } from "@/lib/lisboa/pratos";
import { ROTAS, rotaPrato } from "@/lib/lisboa/textos";
import { LINGUAS } from "@/lib/lisboa/tipos";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hubtransfer.pt";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    // /lisboa nas cinco línguas (en é a principal, x-default)
    ...LINGUAS.map((l) => ({
      url: `${baseUrl}${ROTAS[l]}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: { languages: alternativas((x) => `${baseUrl}${ROTAS[x]}`) },
    })),
    // páginas dos pratos da /lisboa (o mesmo endereço do prato nas cinco línguas)
    ...PRATOS.flatMap((prato) =>
      LINGUAS.map((l) => ({
        url: `${baseUrl}${rotaPrato(l, prato.slug)}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: { languages: alternativas((x) => `${baseUrl}${rotaPrato(x, prato.slug)}`) },
      }))
    ),
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
