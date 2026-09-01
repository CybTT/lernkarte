import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/enrich|api/sentence|api/grade|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
