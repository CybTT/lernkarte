import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Resolves the caller's Supabase session for an API route.
 * - Web app requests carry the session as cookies.
 * - The Chrome extension carries it as `Authorization: Bearer <access_token>`.
 * Either way, the returned client is scoped to that user's token, so RLS applies.
 * The token is verified locally (signature check), not by calling Supabase Auth.
 */
export async function getRouteSupabase(
  request: NextRequest
): Promise<{ supabase: SupabaseClient; user: { id: string } | null }> {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearer) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
    const { data } = await supabase.auth.getClaims(bearer);
    return { supabase, user: userFrom(data?.claims?.sub) };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // API routes don't need to persist refreshed cookies.
        },
      },
    }
  );
  const { data } = await supabase.auth.getClaims();
  return { supabase, user: userFrom(data?.claims?.sub) };
}

function userFrom(id: string | undefined): { id: string } | null {
  return id ? { id } : null;
}
