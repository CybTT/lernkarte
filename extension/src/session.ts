export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  user: { id: string; email: string | null };
}

const KEY = "lernkarte_session";

export async function getSession(): Promise<StoredSession | null> {
  const result = await chrome.storage.local.get(KEY);
  return (result[KEY] as StoredSession | undefined) ?? null;
}

export async function setSession(session: StoredSession): Promise<void> {
  await chrome.storage.local.set({ [KEY]: session });
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(KEY);
}
