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
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-col gap-2 mb-8 text-center sm:text-left">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">
          Sözlük
        </h1>
        <p className="text-sm text-neutral-400">
          Kayıtlı kelimelerini yönet, filtrele ve ustalık durumlarını incele.
        </p>
      </div>

      <DictionaryView words={(words as Word[]) ?? []} initialTab={filter === "leeches" ? "leeches" : "all"} />
    </main>
  );
}
