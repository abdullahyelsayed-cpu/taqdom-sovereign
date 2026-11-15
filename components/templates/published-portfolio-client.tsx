"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Globe2 } from "lucide-react";
import { formatStandalonePortfolioTitle, PortfolioData } from "@/lib/types";
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
  const isShellSsr = ssrUsername === "_shell";

  const [activeUsername, setActiveUsername] = useState<string>(isShellSsr ? "" : ssrUsername);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(initialPortfolio);
  const [isLoading, setIsLoading] = useState<boolean>(isShellSsr);

  const trackedViewForRef = useRef<string>("");

  useEffect(() => {
    const detected = detectBrowserSubdomain(ssrUsername);
    const resolvedDetected = detected === "_shell" ? "" : detected;
    setActiveUsername(resolvedDetected);
    const localPublished = useTaqdomStore.getState().publishedPortfolios;

    // 1. If Edge Worker already injected fresh D1 data, use it immediately after hydration
    if (typeof window !== "undefined" && window.__TAQDOM_PORTFOLIO__ !== undefined) {
      setPortfolio(window.__TAQDOM_PORTFOLIO__);
      setIsLoading(false);
    } else if (!resolvedDetected) {
      setPortfolio(null);
      setIsLoading(false);
      return;
    } else if (detected !== ssrUsername) {
      if (localPublished[detected]) {
        setPortfolio(localPublished[detected]);
        setIsLoading(false);
      } else {
        setPortfolio(null);
        setIsLoading(true);
      }
    } else if (localPublished[detected]) {
      const localItem = localPublished[detected];
      setPortfolio((prev) => {
        if (!prev || prev.username !== detected) return localItem;
        if ((localItem.updatedAt || 0) > (prev.updatedAt || 0)) return localItem;
        return prev;
      });
    }

    if (!resolvedDetected) return;

    const trackViewOnce = (targetSlug: string) => {
      if (trackedViewForRef.current === targetSlug) return;
      trackedViewForRef.current = targetSlug;
      // Increment view counter once for confirmed published portfolio & drain response stream cleanly
      fetch("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetSlug }),
      })
        .then((res) => res.text())
        .catch(() => {});
    };

    if (typeof window !== "undefined" && window.__TAQDOM_PORTFOLIO__) {
      trackViewOnce(resolvedDetected);
    }

    // 2. Fetch fresh published state from server API and always consume response stream
    let cancelled = false;
    fetch(`/api/portfolio?u=${encodeURIComponent(resolvedDetected)}&mode=published`, {
      cache: "no-store",
    })
      .then(async (r) => {
        if (cancelled) {
          await r.text().catch(() => {});
          return;
        }
        if (r.ok) {
          const data = await r.json();
          if (data?.portfolio) {
            trackViewOnce(resolvedDetected);
            setPortfolio((prev) => {
              if (
                prev &&
                prev.username === data.portfolio.username &&
                prev.updatedAt &&
                prev.updatedAt === data.portfolio.updatedAt &&
                prev.publishedAt === data.portfolio.publishedAt
              ) {
                return prev;
              }
              return data.portfolio;
            });
          }
        } else {
          await r.text().catch(() => {});
          if (r.status === 404) {
            setPortfolio(null);
          }
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ssrUsername]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const applyHeadMeta = () => {
      if (portfolio) {
        const nextTitle = formatStandalonePortfolioTitle(portfolio, activeUsername);
        document.title = nextTitle;
        const setMeta = (selector: string, val: string) => {
          document.querySelectorAll(selector).forEach((el) => {
            el.setAttribute("content", val);
          });
        };
        setMeta('meta[property="og:title"]', nextTitle);
        setMeta('meta[name="twitter:title"]', nextTitle);
        const desc = portfolio.seo?.description || portfolio.bio?.en || portfolio.bio?.ar || "";
        if (desc) {
          setMeta('meta[name="description"]', desc);
          setMeta('meta[property="og:description"]', desc);
          setMeta('meta[name="twitter:description"]', desc);
        }
        const img = portfolio.cover || portfolio.avatar || "";
        if (img) {
          const fullImg = img.startsWith("/") ? `https://taqdom.me${img}` : img;
          setMeta('meta[property="og:image"]', fullImg);
          setMeta('meta[name="twitter:image"]', fullImg);
        }
      } else if (!isLoading && activeUsername) {
        document.title = `${activeUsername}.taqdom.me — هذا النطاق متاح للحجز | تَقَدُّم`;
        document.querySelectorAll('meta[name="robots"]').forEach((el) => {
          el.setAttribute("content", "noindex, nofollow");
        });
      }
    };
    applyHeadMeta();
    const timer = window.setTimeout(applyHeadMeta, 60);
    return () => window.clearTimeout(timer);
  }, [portfolio, activeUsername, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center bg-background text-foreground">
        <TaqdomLogo size={56} showWordmark={false} />
        {activeUsername && activeUsername !== "_shell" && (
          <p dir="ltr" className="mt-4 font-mono text-xs text-[#9A7B4F] dark:text-[#C89D66] animate-pulse">
            https://{activeUsername}.taqdom.me
          </p>
        )}
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
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#9A7B4F]/45 bg-[#9A7B4F]/10 px-4 py-1.5 text-xs font-bold text-[#9A7B4F] dark:text-[#C89D66]">
          <Globe2 className="h-4 w-4" />
          <span dir="ltr">{activeUsername}.taqdom.me</span>
        </div>
        <h1 className="arabic-diacritics mt-5 text-3xl sm:text-5xl font-extrabold">
          هذا النطاق الفرعي متاح للحجز الفوري!
        </h1>
        <p className="mt-3 max-w-lg text-sm sm:text-base text-muted-foreground">
          النطاق السيادي{" "}
          <span dir="ltr" className="font-mono font-bold text-[#9A7B4F] dark:text-[#C89D66]">
            https://{activeUsername}.taqdom.me
          </span>{" "}
          لم يتم نشره بعد. احجزه الآن وأنشئ هويتك الرقمية الاحترافية في دقائق.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`https://taqdom.me/studio?u=${encodeURIComponent(activeUsername)}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#141413] dark:bg-[#C89D66] px-6 py-3.5 text-sm font-extrabold text-[#F7F5F0] dark:text-[#0A0A09] shadow-xl"
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
