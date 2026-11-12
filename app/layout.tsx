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
import "./reimagined.css";
import "./royal.css";

const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex",
  display: "swap",
});

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
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
    default: "تقدّم | بورتفوليو شخصي مجاني دائمًا",
    template: "%s | تَقَدُّم • Taqdom",
  },
  description:
    "أنشئ بورتفوليو شخصيًا متكاملًا يعرض مشاريعك ومهاراتك وإنجازاتك، وشاركه برابط يحمل اسمك — مجاني دائمًا، وفي أي وقت.",
  keywords: [
    "تقدم",
    "تَقَدُّم",
    "Taqdom",
    "Personal Portfolio",
    "بورتفوليو شخصي مجاني",
    "معرض أعمال",
    "Free Portfolio",
    "Egypt Creators",
    "Professional Portfolio",
  ],
  alternates: {
    canonical: "https://taqdom.me",
  },
  openGraph: {
    type: "website",
    url: "https://taqdom.me",
    siteName: "تَقَدُّم | Taqdom",
    title: "تقدّم | بورتفوليو شخصي مجاني دائمًا",
    description:
      "اعرض مشاريعك ومهاراتك في بورتفوليو شخصي متكامل، مجاني دائمًا، وعلى رابط يحمل اسمك.",
    images: [
      {
        url: "/images/ultra/haven-hero.webp",
        width: 1200,
        height: 630,
        alt: "تَقَدُّم | Taqdom Personal Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taqdom — Free Personal Portfolio",
    description:
      "Create and publish a complete personal portfolio, free forever, on a link with your name.",
    images: ["/images/ultra/haven-hero.webp"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
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
        "بورتفوليو شخصي متكامل لعرض المشاريع والمهارات والإنجازات، مجاني دائمًا للجميع.",
      inLanguage: ["ar", "en"],
    },
    {
      "@type": "Organization",
      "@id": "https://taqdom.me/#organization",
      name: "تَقَدُّم | Taqdom",
      url: "https://taqdom.me",
      logo: "https://taqdom.me/icon.svg",
      founder: { "@type": "Person", name: "عبدالله يحى", alternateName: "Abdullah Yehia", image: "https://taqdom.me/images/abdullah-yehia.webp", sameAs: ["https://www.linkedin.com/in/abdullah-yehia/", "https://github.com/abdullahyelsayed-cpu"] },
      sameAs: ["https://github.com/abdullahyelsayed-cpu/taqdom-sovereign"],
    },
    {
      "@type": "SoftwareApplication",
      name: "Taqdom Portfolio Studio",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      url: "https://taqdom.me/studio",
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
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#F7F8F3" />
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
