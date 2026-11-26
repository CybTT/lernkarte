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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#07080a]/80 backdrop-blur-xl">
      {/* Below desktop width the links drop to their own full-width row under the logo. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:py-4">
        
        {/* Polkadot Style Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white transition-transform group-hover:scale-105">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-red-500 to-amber-400" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white transition-opacity group-hover:opacity-90">
            LernKarte
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="order-last grid w-full grid-cols-5 gap-0.5 sm:gap-2 lg:order-none lg:flex lg:w-auto lg:items-center">
          {LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "truncate rounded-full px-1 py-1.5 text-center text-[11px] font-medium transition-all duration-200 sm:text-sm lg:px-4",
                  isActive
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#15161c] px-4 py-1.5 text-xs font-medium text-neutral-300 transition-all hover:border-white/20 hover:bg-[#20222b] hover:text-white"
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
