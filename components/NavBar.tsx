"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const LINKS = [
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/dictionary", label: t.nav.dictionary },
    { href: "/study", label: t.nav.study },
    { href: "/sentence", label: t.nav.sentence },
    { href: "/extension-connect", label: t.nav.extension },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-ink">
      {/* Below desktop width the links drop to their own full-width row under the logo. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 pt-3 sm:px-6 lg:flex-nowrap lg:py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 rounded-[3px]">
          <span aria-hidden className="h-3 w-3 rounded-full bg-red" />
          <span className="font-display text-xl font-bold">LernKarte</span>
        </Link>

        <nav className="order-last -mx-1 grid w-full grid-cols-5 lg:order-none lg:mx-0 lg:flex lg:w-auto lg:items-center lg:gap-1">
          {LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative truncate rounded-[3px] px-1 py-3 text-center text-[12px] transition-colors sm:text-sm lg:px-3 lg:py-2",
                  isActive ? "text-text" : "text-muted-text hover:text-text"
                )}
              >
                {link.label}
                {isActive && (
                  <span aria-hidden className="absolute inset-x-2 bottom-0 h-[2px] bg-red lg:-bottom-[13px]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher variant="plain" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-[3px] px-2 py-2 text-sm text-muted-text transition-colors hover:text-text"
            aria-label={t.nav.logoutAria}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.nav.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
