import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Server-side client scoped to the current request's auth session (RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; middleware refreshes the session instead.
          }
        },
      },
    }
  );
}

/**
 * The signed-in user's id, verified locally from the session token's
 * signature — no round-trip to Supabase Auth, which sits on another continent
 * from the app server. Sends the visitor to /login if there's no valid session.
 */
export async function requireUserId(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/login");
  return id;
}
