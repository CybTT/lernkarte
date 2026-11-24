"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const LINKS = [
    { href: "/", label: t.nav.dashboard },
    { href: "/dictionary", label: t.nav.dictionary },
    { href: "/study", label: t.nav.study },
    { href: "/extension-connect", label: t.nav.extension },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#07080a]/80 backdrop-blur-xl">
      {/* On phones the links drop to their own full-width row under the logo. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-4">
        
        {/* Polkadot Style Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white transition-transform group-hover:scale-105">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-red-500 to-amber-400" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white transition-opacity group-hover:opacity-90">
            LernKarte
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="order-last grid w-full grid-cols-4 gap-1 sm:order-none sm:flex sm:w-auto sm:items-center sm:gap-2">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-2 py-1.5 text-center text-xs font-medium transition-all duration-200 sm:px-4 sm:text-sm",
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
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t.nav.theme}
          >
            <Sun className="h-4 w-4" />
          </button>
          
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
