/**
 * Turns an untrusted `?next=` value into a path on this site, so a crafted
 * link like `/login?next=https://evil.example` can't send someone to another
 * site after they sign in. Anything that isn't a plain same-site path falls
 * back to `fallback`.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (typeof next !== "string" || next.length === 0) return fallback;
  // Must be a path, not a protocol-relative URL ("//evil") or a backslash trick ("/\evil").
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;

  const base = "https://lernkarte.invalid";
  let url: URL;
  try {
    url = new URL(next, base);
  } catch {
    return fallback;
  }
  if (url.origin !== base) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
