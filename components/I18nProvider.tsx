"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

/** Makes the active interface language available to client components. */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, t: getDictionary(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

/** For client components: the active language and its texts. */
export function useI18n(): { locale: Locale; t: Dictionary } {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
