import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildStudySession } from "@/lib/engine";
import type { Word } from "@/lib/types";
import { StudySession } from "@/components/StudySession";
import { Button } from "@/components/ui/button";

export default async function StudyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_goal")
    .eq("id", user!.id)
    .single();

  const { data: candidates } = await supabase
    .from("words")
    .select("*")
    .eq("user_id", user!.id)
    .lte("next_review", new Date().toISOString());

  const { data: allWords } = await supabase
    .from("words")
    .select("id, term, meaning_tr")
    .eq("user_id", user!.id)
    .eq("enriched", true);

  const distractorPool = (allWords ?? []) as { id: string; term: string; meaning_tr: string | null }[];

  const session = buildStudySession((candidates as Word[]) ?? [], profile?.daily_goal ?? 20);

  if (session.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Bugünlük due kelime yok 🎉</h1>
        <p className="text-muted-foreground">
          Yeni kelimeler ekleyerek sözlüğünü büyütebilir ya da daha sonra tekrar gelebilirsin.
        </p>
        <Button render={<Link href="/dictionary" />} nativeButton={false}>
          Sözlüğe git
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col p-6">
      <StudySession items={session} distractorPool={distractorPool} />
    </main>
  );
}
