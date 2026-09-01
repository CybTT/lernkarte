import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Resolves the caller's Supabase session for an API route.
 * - Web app requests carry the session as cookies.
 * - The Chrome extension carries it as `Authorization: Bearer <access_token>`.
 * Either way, the returned client is scoped to that user's token, so RLS applies.
 */
export async function getRouteSupabase(
  request: NextRequest
): Promise<{ supabase: SupabaseClient; user: User | null }> {
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
    const {
      data: { user },
    } = await supabase.auth.getUser(bearer);
    return { supabase, user };
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
