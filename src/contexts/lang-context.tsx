"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import fr from "@/i18n/fr.json";
import en from "@/i18n/en.json";

export type Lang = "fr" | "en";
export type T = typeof fr;

interface LangCtx {
  lang: Lang;
  t: T;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangCtx>({ lang: "fr", t: fr, setLang: () => {} });

export function LangProvider({ children, initial }: { children: React.ReactNode; initial: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const router = useRouter();
  const t: T = lang === "en" ? (en as T) : fr;

  const setLang = useCallback(
    async (l: Lang) => {
      setLangState(l);
      await fetch("/api/lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: l }),
      });
      router.refresh();
    },
    [router]
  );

  return <LangContext.Provider value={{ lang, t, setLang }}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return useContext(LangContext);
}
