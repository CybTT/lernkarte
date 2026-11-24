import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { safeNextPath } from "@/lib/safeNext";
import { getI18n } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; code?: string; error?: string }>;
}) {
  const { next: rawNext, code } = await searchParams;
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
    <main className="flex flex-1 items-center justify-center p-6 min-h-screen">
      <div className="polkadot-card relative w-full max-w-md p-8 sm:p-10 rounded-2xl flex flex-col items-center gap-6 text-center overflow-hidden">
        
        <LanguageSwitcher className="absolute right-4 top-4 z-10" />

        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white mb-2">
            <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-r from-red-500 to-amber-400" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            LernKarte
          </h1>
          <p className="text-sm text-neutral-400">
            {t.login.subtitle}
          </p>
        </div>

        <div className="w-full text-left mt-2">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
