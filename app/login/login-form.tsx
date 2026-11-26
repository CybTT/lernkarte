"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safeNext";
import { useI18n } from "@/components/I18nProvider";
import { fmtParts, type Dictionary } from "@/lib/i18n";

type Mode = "signin" | "signup";
type Status = "idle" | "busy" | "error" | "confirm-email";

function friendlyError(message: string, t: Dictionary["login"]): string {
  if (message.includes("Invalid login credentials")) return t.errInvalid;
  if (message.includes("already registered") || message.includes("already been registered"))
    return t.errRegistered;
  if (message.includes("Password should be at least")) return t.errShortPassword;
  if (message.includes("Unable to validate email")) return t.errBadEmail;
  return message;
}

export function LoginForm({
  next: rawNext,
  initialMode = "signin",
}: {
  next?: string;
  initialMode?: Mode;
}) {
  const next = safeNextPath(rawNext);
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("busy");
    setError(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus("error");
        setError(friendlyError(error.message, t.login));
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (next !== "/dashboard") redirectTo.searchParams.set("next", next);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo.toString() },
    });
    if (error) {
      setStatus("error");
      setError(friendlyError(error.message, t.login));
      return;
    }
    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }
    setStatus("confirm-email");
  }

  if (status === "confirm-email") {
    return (
      <p className="text-sm text-neutral-300 text-center">
        {fmtParts(t.login.confirmEmail, {
          email: (
            <strong key="email" className="text-white">
              {email}
            </strong>
          ),
        })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            {t.login.email}
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder={t.login.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#121318] p-3 text-sm text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            {t.login.password}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#121318] p-3 text-sm text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={status === "busy"}
          className="mt-2 w-full rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white py-3 text-sm font-medium transition-all disabled:opacity-40 hover:scale-[1.02]"
        >
          {status === "busy"
            ? mode === "signin"
              ? t.login.signingIn
              : t.login.creatingAccount
            : mode === "signin"
              ? t.login.signIn
              : t.login.signUp}
        </button>

        {status === "error" && error && (
          <p className="text-sm text-rose-400 text-center font-medium">{error}</p>
        )}
      </form>

      <button
        type="button"
        className="text-xs text-neutral-400 hover:text-white transition-colors text-center mt-2"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setStatus("idle");
          setError(null);
        }}
      >
        {mode === "signin" ? t.login.toSignUp : t.login.toSignIn}
      </button>
    </div>
  );
}
