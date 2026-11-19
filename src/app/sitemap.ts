import type { MetadataRoute } from "next";

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
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
