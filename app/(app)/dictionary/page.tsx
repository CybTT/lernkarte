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
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-col gap-2 mb-8 text-center sm:text-left">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">
          {t.dictionary.title}
        </h1>
        <p className="text-sm text-neutral-400">
          {t.dictionary.subtitle}
        </p>
      </div>

      <DictionaryView words={(words as Word[]) ?? []} initialTab={filter === "leeches" ? "leeches" : "all"} />
    </main>
  );
}
