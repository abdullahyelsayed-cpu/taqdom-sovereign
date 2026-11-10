import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/templates", "/explore", "/auth"],
        disallow: ["/api/", "/dashboard/settings"],
      },
    ],
    sitemap: "https://taqdom.me/sitemap.xml",
    host: "https://taqdom.me",
  };
}
