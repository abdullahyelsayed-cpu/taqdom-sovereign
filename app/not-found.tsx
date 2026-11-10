import React from "react";
import Link from "next/link";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background text-foreground">
      <TaqdomLogo size={60} showWordmark={false} />
      <h1 className="arabic-diacritics mt-6 text-4xl sm:text-6xl font-extrabold">
        ٤٠٤ • الصفحة أو النطاق متاح للحجز
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        لم نتمكن من العثور على هذه الصفحة، أو أن هذا النطاق الفرعي متاح للحجز الفوري في استوديو تَقَدُّم.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-xl bg-[#C5A059] px-6 py-3 text-sm font-bold text-[#111113]"
        >
          العودة للرئيسية • Home
        </Link>
        <Link
          href="/studio"
          className="rounded-xl border border-border bg-secondary px-6 py-3 text-sm font-bold"
        >
          فتح الاستوديو • Open Studio
        </Link>
      </div>
    </main>
  );
}
