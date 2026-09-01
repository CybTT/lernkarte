import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { clearSession, getSession, setSession, type StoredSession } from "./session";

const EXPIRY_SKEW_SECONDS = 30;

async function refreshSession(refreshToken: string): Promise<StoredSession> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error("Session refresh failed");
  const data = await res.json();
  const session: StoredSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    user: { id: data.user.id, email: data.user.email ?? null },
  };
  await setSession(session);
  return session;
}

/** Returns a session with a non-expired access token, refreshing if needed. */
export async function getValidSession(): Promise<StoredSession | null> {
  const session = await getSession();
  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at - now > EXPIRY_SKEW_SECONDS) return session;

  try {
    return await refreshSession(session.refresh_token);
  } catch {
    await clearSession();
    return null;
  }
}

export interface InsertedWord {
  id: string;
}

export async function insertWord(input: {
  term: string;
  context_sentence: string | null;
}): Promise<InsertedWord> {
  const session = await getValidSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/words`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      term: input.term,
      context_sentence: input.context_sentence,
      user_id: session.user.id,
      source: "extension",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Insert failed: ${res.status} ${text}`);
  }
  const [row] = await res.json();
  return row as InsertedWord;
}

export async function pingEnrich(appUrl: string, wordId: string): Promise<void> {
  const session = await getValidSession();
  if (!session) return;
  await fetch(`${appUrl}/api/enrich`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ word_ids: [wordId] }),
  }).catch(() => {
    // Enrichment can be retried later from the dictionary screen; don't block the add flow.
  });
}
