import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buildStudySession } from "@/lib/engine";
import { attachOptions } from "@/lib/studyOptions";
import { applyMode, parseMode } from "@/lib/studyModes";
import type { Word } from "@/lib/types";
import { StudySession } from "@/components/StudySession";
import { StudyModeTabs } from "@/components/StudyModeTabs";
import { Button } from "@/components/ui/button";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: modeParam } = await searchParams;
  const mode = parseMode(modeParam);

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

  // Word selection (due pool, leech priority, mastered top-up) is identical in
  // every mode — only the question type differs.
  const session = applyMode(
    buildStudySession((candidates as Word[]) ?? [], profile?.daily_goal ?? 20),
    mode
  );

  const items = await attachOptions(supabase, session);

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 p-6">
        <StudyModeTabs active={mode} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-semibold">Bugünlük due kelime yok 🎉</h1>
          <p className="text-muted-foreground">
            Yeni kelimeler ekleyerek sözlüğünü büyütebilir ya da daha sonra tekrar gelebilirsin.
          </p>
          <Button render={<Link href="/dictionary" />} nativeButton={false}>
            Sözlüğe git
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 p-6">
      <StudyModeTabs active={mode} />
      <StudySession items={items} />
    </main>
  );
}
