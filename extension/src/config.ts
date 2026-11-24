// Fill these in from your Supabase project settings (API section).
// The anon key is public by design — RLS is what keeps data private.
export const SUPABASE_URL = "https://bsfaiaifmoaammmenhhq.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzZmFpYWlmbW9hYW1tbWVuaGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzc2NzUsImV4cCI6MjEwMzg1MzY3NX0.qTZExw77d2noZh0ljV1S0xTqqtI_bTBH-P-mvBYUDKY";

// Where the LernKarte web app is hosted. Used for the login handoff and to
// ping /api/enrich after inserting a new word. Keep manifest.json's
// auth-bridge `matches` and `host_permissions` in sync with this.
export const APP_URL = "https://lernkartee.vercel.app";

/** The only origin the extension accepts a login session from. */
export const APP_ORIGIN = new URL(APP_URL).origin;
