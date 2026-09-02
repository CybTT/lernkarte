import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; code?: string; error?: string }>;
}) {
  const { next, code } = await searchParams;

  // Defensive fallback: Supabase redirects here with ?code=... instead of
  // /auth/callback when the callback URL isn't in the project's Redirect
  // URLs allow-list (it falls back to the Site URL). Handle it here too so
  // the signup email-confirmation flow still completes.
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next ?? "/");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">LernKarte</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Almanca kelime dağarcığına giriş yap
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </main>
  );
}
