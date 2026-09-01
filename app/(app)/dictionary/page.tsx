import { createClient } from "@/lib/supabase/server";
import { DictionaryView } from "@/components/DictionaryView";
import type { Word } from "@/lib/types";

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: words } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <h1 className="text-2xl font-semibold mb-6">Sözlük</h1>
      <DictionaryView words={(words as Word[]) ?? []} initialTab={filter === "leeches" ? "leeches" : "all"} />
    </main>
  );
}
