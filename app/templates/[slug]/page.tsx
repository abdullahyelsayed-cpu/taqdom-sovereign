import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TEMPLATES_CATALOG, SEED_PORTFOLIOS } from "@/lib/seed-data";
import { PortfolioRenderer } from "@/components/templates/portfolio-renderer";

export async function generateStaticParams() {
  return TEMPLATES_CATALOG.map((t) => ({ slug: t.slug }));
}

export default async function SingleTemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tpl = TEMPLATES_CATALOG.find((item) => item.slug === slug);
  if (!tpl) {
    notFound();
  }

  const sampleData = SEED_PORTFOLIOS[tpl.defaultCreatorUsername] || SEED_PORTFOLIOS.test;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-[#0B0C14] border-b border-[#1F2233] px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-[#EDEAE2]">
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <Link href="/templates" className="text-[#D4AF37] font-bold hover:underline">
            ← القوالب الأربعة / All Templates
          </Link>
          <span className="opacity-40">|</span>
          <span className="font-bold">
            معاينة قالب {tpl.name.ar} ({tpl.name.en})
          </span>
        </div>
        <Link
          href={`/studio?template=${tpl.id}`}
          className="rounded-xl bg-[#D4AF37] px-4 py-1.5 text-xs font-bold text-[#050508]"
        >
          استخدم هذا القالب في الاستوديو • Use in Studio
        </Link>
      </div>
      <div className="flex-1">
        <PortfolioRenderer data={sampleData} />
      </div>
    </div>
  );
}
