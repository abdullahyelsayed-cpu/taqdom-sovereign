"use client";

import React from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";
import { TaqdomLogo } from "@/components/brand/taqdom-logo";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center bg-background text-foreground">
      <TaqdomLogo size={64} showWordmark={false} />
      <h1 className="arabic-diacritics mt-6 text-3xl sm:text-5xl font-extrabold">
        حدث خطأ غير متوقع في الفضاء الرقمي
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        نعتذر عن هذا الخلل العارض. يمكنك إعادة المحاولة فوراً أو العودة إلى الصفحة الرئيسية لمنصة تَقَدُّم.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#C5A059] px-6 py-3 text-sm font-bold text-[#111113] shadow-lg cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>إعادة المحاولة / Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary px-6 py-3 text-sm font-bold"
        >
          <Home className="h-4 w-4" />
          <span>الرئيسية / Home</span>
        </Link>
      </div>
    </div>
  );
}
