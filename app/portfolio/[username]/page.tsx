import React from "react";
import type { Metadata } from "next";
import { getPublishedPortfolio } from "@/lib/db";
import { normalizeUsername, safePortfolioUrl } from "@/lib/types";
import { PublishedPortfolioClient } from "@/components/templates/published-portfolio-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const clean = normalizeUsername(username);
  const portfolio = await getPublishedPortfolio(clean);

  const canonicalUrl = `https://${clean}.taqdom.me`;

  if (!portfolio) {
    const unclaimedTitle = `${clean}.taqdom.me — هذا النطاق متاح للحجز | تَقَدُّم`;
    return {
      title: { absolute: unclaimedTitle },
      description: `احجز النطاق السيادي ${clean}.taqdom.me وأنشئ معرض أعمالك الفاخر على منصة تَقَدُّم.`,
      robots: { index: false, follow: false },
      alternates: { canonical: canonicalUrl },
    };
  }

  const title =
    portfolio.seo?.title ||
    `${portfolio.name.ar} | ${portfolio.name.en} — ${portfolio.title.ar} | تَقَدُّم`;
  const description =
    portfolio.seo?.description ||
    `${portfolio.bio.ar} — ${portfolio.bio.en}`;

  return {
    title: { absolute: title },
    description,
    keywords: portfolio.seo?.keywords || [
      portfolio.name.ar,
      portfolio.name.en,
      clean,
      "Taqdom",
      "تقدم",
    ],
    robots: portfolio.seo?.noindex ? { index: false, follow: false } : { index: true, follow: true },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "profile",
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: portfolio.projects[0]?.images[0] || portfolio.cover || "/images/ultra/haven-hero.webp",
          width: 1200,
          height: 630,
          alt: portfolio.name.en,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [portfolio.projects[0]?.images[0] || portfolio.cover || "/images/ultra/haven-hero.webp"],
    },
  };
}

export default async function PortfolioSubdomainPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const clean = normalizeUsername(username);
  const portfolio = await getPublishedPortfolio(clean);

  const personJsonLd = portfolio
    ? {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url: `https://${clean}.taqdom.me`,
        mainEntity: {
          "@type": "Person",
          name: portfolio.name.en,
          alternateName: portfolio.name.ar,
          jobTitle: portfolio.title.en,
          description: portfolio.bio.en,
          image: `https://taqdom.me${portfolio.avatar}`,
          url: `https://${clean}.taqdom.me`,
          address: {
            "@type": "PostalAddress",
            addressLocality: portfolio.city.en,
          },
          sameAs: portfolio.links.map((link) => safePortfolioUrl(link.url)).filter((url) => url !== "#"),
        },
        hasPart: portfolio.projects.map((p) => ({
          "@type": "CreativeWork",
          name: p.title.en,
          headline: p.title.ar,
          description: p.desc.en,
          dateCreated: p.year,
        })),
      }
    : null;

  return (
    <>
      {personJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\\u2028/g, "\\u2028").replace(/\\u2029/g, "\\u2029") }}
        />
      )}
      <PublishedPortfolioClient initialPortfolio={portfolio} username={clean} />
    </>
  );
}
