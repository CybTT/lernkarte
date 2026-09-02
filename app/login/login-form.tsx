"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup";
type Status = "idle" | "busy" | "error" | "confirm-email";

function friendlyError(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-posta veya şifre yanlış.";
  if (message.includes("already registered") || message.includes("already been registered"))
    return "Bu e-posta zaten kayıtlı, giriş yapmayı dene.";
  if (message.includes("Password should be at least")) return "Şifre en az 6 karakter olmalı.";
  if (message.includes("Unable to validate email")) return "Geçersiz e-posta adresi.";
  return message;
}

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
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
        setError(friendlyError(error.message));
        return;
      }
      router.push(next ?? "/");
      router.refresh();
      return;
    }

    // signup
    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (next) redirectTo.searchParams.set("next", next);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo.toString() },
    });
    if (error) {
      setStatus("error");
      setError(friendlyError(error.message));
      return;
    }
    if (data.session) {
      // Email confirmation is disabled on this project — already logged in.
      router.push(next ?? "/");
      router.refresh();
      return;
    }
    setStatus("confirm-email");
  }

  if (status === "confirm-email") {
    return (
      <p className="text-sm text-muted-foreground text-center">
        <strong className="text-foreground">{email}</strong> adresine bir onay bağlantısı
        gönderdik. Onayladıktan sonra giriş yapabilirsin.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="sen@ornek.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={status === "busy"} className="w-full">
          {status === "busy"
            ? mode === "signin"
              ? "Giriş yapılıyor…"
              : "Hesap oluşturuluyor…"
            : mode === "signin"
              ? "Giriş yap"
              : "Hesap oluştur"}
        </Button>
        {status === "error" && error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </form>
      <button
        type="button"
        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setStatus("idle");
          setError(null);
        }}
      >
        {mode === "signin" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
      </button>
    </div>
  );
}
