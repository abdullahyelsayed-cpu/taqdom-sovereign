"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Lang = "ar" | "en";

interface LanguageContextValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (ar: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  dir: "rtl",
  setLang: () => {},
  toggleLang: () => {},
  t: (ar) => ar,
});

export function LanguageProvider({
  children,
  initialLang = "ar",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const applyDomLang = useCallback((nextLang: Lang) => {
    if (typeof document === "undefined") return;
    const dir = nextLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = nextLang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem("taqdom_lang", nextLang);
      document.cookie = `taqdom_lang=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("taqdom_lang") as Lang | null;
      if (saved === "ar" || saved === "en") {
        setLangState(saved);
        applyDomLang(saved);
        return;
      }
    } catch {
      // Ignore
    }
    applyDomLang(initialLang);
  }, [initialLang, applyDomLang]);

  const setLang = useCallback(
    (nextLang: Lang) => {
      setLangState(nextLang);
      applyDomLang(nextLang);
    },
    [applyDomLang]
  );

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "ar" ? "en" : "ar";
      applyDomLang(next);
      return next;
    });
  }, [applyDomLang]);

  const t = useCallback(
    (ar: string, en: string) => (lang === "ar" ? ar : en),
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        dir: lang === "ar" ? "rtl" : "ltr",
        setLang,
        toggleLang,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
