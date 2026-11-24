"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";
import { fmt } from "@/lib/i18n";

function stripLeadingArticle(term: string): string {
  return term.replace(/^(der|die|das)\s+/i, "").trim();
}

export function AddWordForm() {
  const [term, setTerm] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = stripLeadingArticle(term.trim());
    if (!cleaned) return;

    setBusy(true);
    const supabase = createClient();
    // The locally stored session is enough here: the database itself (RLS)
    // rejects inserts for anyone but the signed-in user.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      toast.error(t.addWord.loginFirst);
      setBusy(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("words")
      .insert({ term: cleaned, user_id: user.id, source: "manual" })
      .select("id")
      .single();

    if (error || !inserted) {
      toast.error(t.addWord.failed);
      setBusy(false);
      return;
    }

    setTerm("");
    setBusy(false);
    toast.success(fmt(t.addWord.added, { term: cleaned }));
    router.refresh();

    fetch("/api/enrich", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ word_ids: [inserted.id] }),
    })
      .then(async (res) => {
        if (!res.ok) {
          toast.error(fmt(t.addWord.enrichFailed, { term: cleaned }));
          return;
        }
        const data = await res.json().catch(() => null);
        const report = data?.results?.[0];
        router.refresh();

        if (report?.needs_review) {
          toast.error(fmt(t.addWord.notRecognized, { term: cleaned }));
        } else if (report?.corrected) {
          toast.success(fmt(t.addWord.corrected, { input: cleaned, term: report.term }));
        } else {
          toast.success(fmt(t.addWord.enriched, { term: report?.term ?? cleaned }));
        }
      })
      .catch(() => toast.error(fmt(t.addWord.enrichFailed, { term: cleaned })));
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full">
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={t.addWord.placeholder}
        disabled={busy}
        className="flex-1 rounded-full border border-white/10 bg-[#121318] px-5 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-white/30 focus:outline-none transition-all shadow-inner"
      />
      <button
        type="submit"
        disabled={busy || !term.trim()}
        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white px-6 py-3 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
      >
        <Plus className="h-4 w-4" />
        <span>{t.addWord.add}</span>
      </button>
    </form>
  );
}
