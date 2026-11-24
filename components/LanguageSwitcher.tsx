"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

/** Remembers the chosen language for a year and re-renders the page in it. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label
      className={cn(
        "relative flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 pl-2.5 pr-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white focus-within:border-white/30",
        pending && "opacity-60",
        className
      )}
      title={t.nav.language}
    >
      <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span aria-hidden>{locale.toUpperCase()}</span>
      {/* The native select sits invisibly on top: compact look, full keyboard
          and screen-reader support, and a proper picker on phones. */}
      <select
        value={locale}
        onChange={(e) => change(e.target.value as Locale)}
        disabled={pending}
        aria-label={t.nav.language}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
