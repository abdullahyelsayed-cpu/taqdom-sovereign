import type { MetadataRoute } from "next";
import { getAllPublishedPortfolios } from "@/lib/db";
import { TEMPLATES_CATALOG } from "@/lib/seed-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://taqdom.me",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: "https://taqdom.me/templates",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://taqdom.me/explore",
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://taqdom.me/auth",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...TEMPLATES_CATALOG.map((t) => ({
      url: `https://taqdom.me/templates/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];

  const portfolios = await getAllPublishedPortfolios();
  const portfolioEntries: MetadataRoute.Sitemap = portfolios
    .filter((p) => !p.seo?.noindex)
    .map((p) => ({
      url: `https://${p.username}.taqdom.me`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));

  return [...staticPages, ...portfolioEntries];
}
