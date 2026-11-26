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

  const fieldClass =
    "w-full border-0 border-b border-paper-ink/30 bg-transparent py-2 text-lg outline-none placeholder:text-paper-ink/30 focus-visible:border-red focus-visible:outline-none";

  if (status === "confirm-email") {
    return (
      <div className="px-6 py-8">
        <p className="hand text-2xl leading-snug text-pen">
          {fmtParts(t.login.confirmEmail, {
            email: (
              <strong key="email" className="font-bold">
                {email}
              </strong>
            ),
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="sheet-head px-6 pb-2.5 pt-4">
        <span className="label">{mode === "signin" ? t.login.signIn : t.login.signUp}</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 pb-6 pt-6">
        <label className="flex flex-col gap-1">
          <span className="label">{t.login.email}</span>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t.login.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="label">{t.login.password}</span>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </label>

        <button type="submit" disabled={status === "busy"} className="btn mt-2 w-full">
          {status === "busy"
            ? mode === "signin"
              ? t.login.signingIn
              : t.login.creatingAccount
            : mode === "signin"
              ? t.login.signIn
              : t.login.signUp}
        </button>

        {status === "error" && error && (
          <p role="alert" className="border-l-2 border-red pl-3 text-sm text-red">
            {error}
          </p>
        )}
      </form>

      <button
        type="button"
        className="link mx-6 mb-6 self-start text-sm text-muted-text"
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
