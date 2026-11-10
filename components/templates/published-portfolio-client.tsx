"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Globe2 } from "lucide-react";
import { PortfolioData } from "@/lib/types";
import { PortfolioRenderer } from "./portfolio-renderer";
import { useTaqdomStore } from "@/lib/store";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";

export function PublishedPortfolioClient({
  initialPortfolio,
  username,
}: {
  initialPortfolio: PortfolioData | null;
  username: string;
}) {
  const [activeUsername, setActiveUsername] = useState<string>(username.trim().toLowerCase());
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(initialPortfolio);
  const storePortfolios = useTaqdomStore((s) => s.publishedPortfolios);

  useEffect(() => {
    let detected = username.trim().toLowerCase();
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.endsWith(".taqdom.me")) {
        const sub = host.slice(0, -".taqdom.me".length);
        if (sub && sub !== "www") detected = sub;
      } else if (host.endsWith(".localhost") || host.endsWith(".lvh.me")) {
        const sub = host.split(".")[0];
        if (sub && sub !== "www" && sub !== "localhost") detected = sub;
      }
    }
    setActiveUsername(detected);

    // 1. Check client store if on same origin
    if (storePortfolios[detected]) {
      setPortfolio(storePortfolios[detected]);
    } else if (detected !== username.trim().toLowerCase()) {
      setPortfolio(null);
    }

    // 2. Fetch fresh published state from server API
    fetch(`/api/portfolio?u=${encodeURIComponent(detected)}&mode=published`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.portfolio) {
          setPortfolio(data.portfolio);
        } else if (detected !== username.trim().toLowerCase()) {
          setPortfolio(null);
        }
      })
      .catch(() => {});

    // 3. Increment view counter
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: detected }),
    }).catch(() => {});
  }, [username, storePortfolios]);

  if (!portfolio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center bg-background text-foreground">
        <TaqdomLogo size={64} showWordmark={false} />
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#C5A059]/45 bg-[#C5A059]/10 px-4 py-1.5 text-xs font-bold text-[#C5A059]">
          <Globe2 className="h-4 w-4" />
          <span dir="ltr">{activeUsername}.taqdom.me</span>
        </div>
        <h1 className="arabic-diacritics mt-5 text-3xl sm:text-5xl font-extrabold">
          هذا النطاق الفرعي متاح للحجز الفوري!
        </h1>
        <p className="mt-3 max-w-lg text-sm sm:text-base text-muted-foreground">
          النطاق السيادي <span dir="ltr" className="font-mono font-bold text-[#C5A059]">https://{activeUsername}.taqdom.me</span> لم يتم نشره بعد. احجزه الآن وأنشئ معرض أعمالك ثلاثي الأبعاد في دقائق.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`https://taqdom.me/studio?u=${encodeURIComponent(activeUsername)}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#C5A059] px-6 py-3.5 text-sm font-extrabold text-[#111113] shadow-xl"
          >
            <Sparkles className="h-4 w-4" />
            <span>احجز {activeUsername}.taqdom.me في الاستوديو</span>
          </Link>
          <Link
            href="https://taqdom.me"
            className="rounded-2xl border border-border bg-secondary px-6 py-3.5 text-sm font-bold"
          >
            العودة إلى تَقَدُّم الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return <PortfolioRenderer data={portfolio} isLiveSubdomain />;
}
