"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/dictionary", label: "Sözlük" },
  { href: "/study", label: "Çalış" },
  { href: "/extension-connect", label: "Uzantı" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <nav className="flex items-center gap-1">
        <span className="mr-4 font-semibold">LernKarte</span>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
              pathname === link.href && "bg-secondary text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Çıkış yap">
        <LogOut className="size-4" />
      </Button>
    </header>
  );
}
