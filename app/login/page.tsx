import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { safeNextPath } from "@/lib/safeNext";
import { getI18n } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; code?: string; error?: string; mode?: string }>;
}) {
  const { next: rawNext, code, mode } = await searchParams;
  const next = safeNextPath(rawNext);
  const { t } = await getI18n();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-[3px]">
            <span aria-hidden className="h-3 w-3 rounded-full bg-red" />
            <span className="font-display text-xl font-bold">LernKarte</span>
          </Link>
          <LanguageSwitcher variant="plain" />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-20">
        <div>
          <h1 className="max-w-[14ch] text-4xl font-bold leading-[1.05] sm:text-6xl">{t.landing.title}</h1>
          <p className="mt-5 max-w-[48ch] text-muted-text">{t.login.subtitle}</p>
        </div>
        <div className="sheet sheet-in lg:rotate-[0.6deg]">
          <LoginForm next={next} initialMode={mode === "signup" ? "signup" : "signin"} />
        </div>
      </div>
    </main>
  );
}
