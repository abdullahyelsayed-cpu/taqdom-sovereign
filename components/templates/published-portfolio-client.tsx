"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Globe2 } from "lucide-react";
import { PortfolioData } from "@/lib/types";
import { PortfolioRenderer } from "./portfolio-renderer";
import { useTaqdomStore } from "@/lib/store";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";

declare global {
  interface Window {
    __TAQDOM_SUBDOMAIN__?: string;
    __TAQDOM_PORTFOLIO__?: PortfolioData | null;
  }
}

function detectBrowserSubdomain(fallback: string): string {
  if (typeof window === "undefined") return fallback.trim().toLowerCase();
  if (window.__TAQDOM_SUBDOMAIN__) return window.__TAQDOM_SUBDOMAIN__.trim().toLowerCase();
  const host = window.location.hostname.toLowerCase();
  if (host.endsWith(".taqdom.me")) {
    const sub = host.slice(0, -".taqdom.me".length);
    if (sub && sub !== "www") return sub;
  } else if (host.endsWith(".localhost") || host.endsWith(".lvh.me")) {
    const sub = host.split(".")[0];
    if (sub && sub !== "www" && sub !== "localhost") return sub;
  }
  return fallback.trim().toLowerCase();
}

export function PublishedPortfolioClient({
  initialPortfolio,
  username,
}: {
  initialPortfolio: PortfolioData | null;
  username: string;
}) {
  const ssrUsername = username.trim().toLowerCase();

  const [activeUsername, setActiveUsername] = useState<string>(() =>
    detectBrowserSubdomain(ssrUsername)
  );

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(() => {
    if (typeof window !== "undefined" && window.__TAQDOM_PORTFOLIO__ !== undefined) {
      return window.__TAQDOM_PORTFOLIO__;
    }
    const detected = detectBrowserSubdomain(ssrUsername);
    if (detected !== ssrUsername) {
      return null;
    }
    return initialPortfolio;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (window.__TAQDOM_PORTFOLIO__ !== undefined) return false;
    const detected = detectBrowserSubdomain(ssrUsername);
    return detected !== ssrUsername;
  });

  const storePortfolios = useTaqdomStore((s) => s.publishedPortfolios);

  useEffect(() => {
    const detected = detectBrowserSubdomain(ssrUsername);
    setActiveUsername(detected);

    // 1. If Edge Worker already injected fresh D1 data, use it immediately
    if (typeof window !== "undefined" && window.__TAQDOM_PORTFOLIO__ !== undefined) {
      setPortfolio(window.__TAQDOM_PORTFOLIO__);
      setIsLoading(false);
    } else if (storePortfolios[detected]) {
      const localItem = storePortfolios[detected];
      setPortfolio((prev) => {
        if (!prev || prev.username !== detected) return localItem;
        if ((localItem.updatedAt || 0) > (prev.updatedAt || 0)) return localItem;
        return prev;
      });
    }

    // 2. Fetch fresh published state from server API
    let cancelled = false;
    fetch(`/api/portfolio?u=${encodeURIComponent(detected)}&mode=published`, {
      cache: "no-store",
    })
      .then(async (r) => {
        if (cancelled) return;
        if (r.ok) {
          const data = await r.json();
          if (data?.portfolio) {
            setPortfolio(data.portfolio);
          }
        } else if (r.status === 404) {
          setPortfolio(null);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    // 3. Increment view counter
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: detected }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [ssrUsername, storePortfolios]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center bg-background text-foreground">
        <TaqdomLogo size={56} showWordmark={false} />
        <p dir="ltr" className="mt-4 font-mono text-xs text-[#C5A059] animate-pulse">
          https://{activeUsername}.taqdom.me
        </p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div
        data-testid="subdomain-available-screen"
        className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center bg-background text-foreground"
      >
        <TaqdomLogo size={64} showWordmark={false} />
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#C5A059]/45 bg-[#C5A059]/10 px-4 py-1.5 text-xs font-bold text-[#C5A059]">
          <Globe2 className="h-4 w-4" />
          <span dir="ltr">{activeUsername}.taqdom.me</span>
        </div>
        <h1 className="arabic-diacritics mt-5 text-3xl sm:text-5xl font-extrabold">
          هذا النطاق الفرعي متاح للحجز الفوري!
        </h1>
        <p className="mt-3 max-w-lg text-sm sm:text-base text-muted-foreground">
          النطاق السيادي{" "}
          <span dir="ltr" className="font-mono font-bold text-[#C5A059]">
            https://{activeUsername}.taqdom.me
          </span>{" "}
          لم يتم نشره بعد. احجزه الآن وأنشئ معرض أعمالك ثلاثي الأبعاد في دقائق.
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
