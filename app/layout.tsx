import React from "react";
import type { Metadata } from "next";
import { Readex_Pro, Tajawal, Syne, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { SmoothScrollAndAura } from "@/components/smooth-scroll";
import { Toaster } from "sonner";
import "./globals.css";

const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://taqdom.me"),
  title: {
    default: "تَقَدُّم | Taqdom — المنصة المصرية الفاخرة لمعارض أعمال المبدعين",
    template: "%s | تَقَدُّم • Taqdom",
  },
  description:
    "تَقَدُّم (Taqdom) — المنصة المصرية السيادية والأرقى عالمياً لإنشاء معارض الأعمال (Portfolios) ثلاثية الأبعاد للمعماريين والمخرجين والمصممين ورواد الأعمال على نطاقك الفرعي المستقل username.taqdom.me.",
  keywords: [
    "تقدم",
    "تَقَدُّم",
    "Taqdom",
    "Portfolio Builder",
    "انشاء بورتفوليو",
    "معرض أعمال",
    "3D Portfolio",
    "Egypt Creators",
    "Awwwards Portfolio",
  ],
  alternates: {
    canonical: "https://taqdom.me",
    languages: {
      "ar-EG": "https://taqdom.me",
      "en-US": "https://taqdom.me",
    },
  },
  openGraph: {
    type: "website",
    url: "https://taqdom.me",
    siteName: "تَقَدُّم | Taqdom",
    title: "تَقَدُّم | Taqdom — اصنع أَثَرَك على نطاقك السيادي المستقل",
    description:
      "منصة معارض الأعمال الفاخرة للمبدعين العرب والعالميين بتقنيات WebGL ثلاثية الأبعاد ونطاقات فرعية حية username.taqdom.me.",
    images: [
      {
        url: "/images/hero-mono.png",
        width: 1200,
        height: 630,
        alt: "تَقَدُّم | Taqdom Sovereign Portfolio Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "تَقَدُّم | Taqdom — Sovereign Creative Portfolios",
    description:
      "Launch your museum-grade 3D portfolio on your own sovereign subdomain username.taqdom.me.",
    images: ["/images/hero-mono.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/apple-icon.png",
  },
};

const rootJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://taqdom.me/#website",
      url: "https://taqdom.me",
      name: "تَقَدُّم | Taqdom",
      description:
        "المنصة المصرية الفاخرة والأرقى عالمياً لإنشاء معارض الأعمال للمبدعين",
      inLanguage: ["ar", "en"],
    },
    {
      "@type": "Organization",
      "@id": "https://taqdom.me/#organization",
      name: "تَقَدُّم | Taqdom",
      url: "https://taqdom.me",
      logo: "https://taqdom.me/icon.svg",
      sameAs: ["https://github.com/abdullahyelsayed-cpu/taqdom-sovereign"],
    },
    {
      "@type": "SoftwareApplication",
      name: "Taqdom Studio — استوديو تَقَدُّم",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      url: "https://taqdom.me/studio",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
      </head>
      <body
        className={`${readex.variable} ${tajawal.variable} ${syne.variable} ${jakarta.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider initialLang="ar">
            <SmoothScrollAndAura>{children}</SmoothScrollAndAura>
            <Toaster position="top-center" richColors />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
