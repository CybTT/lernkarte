import { createClient, requireUserId } from "@/lib/supabase/server";
import { DictionaryView } from "@/components/DictionaryView";
import type { Word } from "@/lib/types";
import { getI18n } from "@/lib/i18n/server";

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();
  const [userId, { t }] = await Promise.all([requireUserId(supabase), getI18n()]);

  const { data: words } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-10 flex flex-col gap-3">
        <h1 className="text-4xl font-bold sm:text-6xl">{t.dictionary.title}</h1>
        <p className="max-w-[60ch] text-muted-text">{t.dictionary.subtitle}</p>
      </div>

      <DictionaryView words={(words as Word[]) ?? []} initialTab={filter === "leeches" ? "leeches" : "all"} />
    </main>
  );
}
