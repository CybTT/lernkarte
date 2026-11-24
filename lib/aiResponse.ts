import { NextResponse } from "next/server";

export const AI_UNAVAILABLE_MESSAGE = "Şu an yapay zekâya ulaşılamıyor, biraz sonra tekrar dene.";

/**
 * Friendly error for a failed Claude call. The real cause is logged on the
 * server, never sent to the browser.
 */
export function aiUnavailable(cause: unknown, where: string): NextResponse {
  console.error(`${where} failed:`, (cause as Error)?.message ?? cause);
  return NextResponse.json({ error: AI_UNAVAILABLE_MESSAGE }, { status: 502 });
}
