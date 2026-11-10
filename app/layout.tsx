import React from "react";
import type { Metadata } from "next";
import {
  Readex_Pro,
  IBM_Plex_Sans_Arabic,
  Instrument_Serif,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n";
import { SmoothScrollAndAura } from "@/components/smooth-scroll";
import { Toaster } from "sonner";
import "./globals.css";
import "./polish.css";

const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex",
  display: "swap",
});

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-arabic",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://taqdom.me"),
  title: {
    default: "تَقَدُّم | Taqdom — الهويات الرقمية ومعارض الأعمال",
    template: "%s | تَقَدُّم • Taqdom",
  },
  description:
    "تَقَدُّم منصة عربية لإنشاء الهويات الرقمية ومعارض الأعمال الاحترافية للطلاب والخريجين والمبدعين والمحترفين، مع قوالب مرنة ونطاق فرعي مستقل لكل مستخدم.",
  keywords: [
    "تقدم",
    "تَقَدُّم",
    "Taqdom",
    "Portfolio Builder",
    "انشاء بورتفوليو",
    "معرض أعمال",
    "Digital Identity",
    "Egypt Creators",
    "Professional Portfolio",
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
    title: "تَقَدُّم | Taqdom — هويتك الرقمية في مساحة تحمل اسمك",
    description:
      "أنشئ معرض أعمال احترافيًا بهوية بصرية واضحة ونطاق فرعي مستقل، وشارك مشاريعك وخبراتك بثقة.",
    images: [
      {
        url: "/images/ultra/haven-hero.webp",
        width: 1200,
        height: 630,
        alt: "تَقَدُّم | Taqdom Digital Portfolio Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "تَقَدُّم | Taqdom — Digital Identity & Portfolios",
    description:
      "Build a thoughtful professional portfolio with a distinctive digital identity.",
    images: ["/images/ultra/haven-hero.webp"],
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
        "منصة لإنشاء الهويات الرقمية ومعارض الأعمال للطلاب والخريجين والمبدعين والمحترفين.",
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
        <meta name="color-scheme" content="dark light" />
        <meta name="theme-color" content="#090B0D" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
      </head>
      <body
        className={`${readex.variable} ${ibmArabic.variable} ${instrumentSerif.variable} ${jakarta.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
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
