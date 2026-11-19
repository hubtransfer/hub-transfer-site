import type { MetadataRoute } from "next";
import { PRATOS } from "@/lib/lisboa/pratos";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hubtransfer.pt";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...(["/lisboa", "/en/lisboa", "/es/lisboa"] as const).map((p) => ({
      url: `${baseUrl}${p}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: { "pt-PT": `${baseUrl}/lisboa`, en: `${baseUrl}/en/lisboa`, es: `${baseUrl}/es/lisboa` },
      },
    })),
    // páginas dos pratos da /lisboa (o mesmo endereço do prato nas três línguas)
    ...PRATOS.flatMap((prato) =>
      (["/lisboa", "/en/lisboa", "/es/lisboa"] as const).map((p) => ({
        url: `${baseUrl}${p}/prato/${prato.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: {
          languages: {
            "pt-PT": `${baseUrl}/lisboa/prato/${prato.slug}`,
            en: `${baseUrl}/en/lisboa/prato/${prato.slug}`,
            es: `${baseUrl}/es/lisboa/prato/${prato.slug}`,
          },
        },
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
