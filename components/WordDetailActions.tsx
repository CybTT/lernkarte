"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";

export function WordDetailActions({ wordId }: { wordId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function withAuthHeader() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : ({} as Record<string, string>);
  }

  async function handleReenrich() {
    setBusy(true);
    let res: Response | null = null;
    try {
      const authHeader = await withAuthHeader();
      res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ word_ids: [wordId], force: true }),
      });
    } catch {
      res = null;
    } finally {
      setBusy(false);
    }
    if (res?.ok) {
      toast.success(t.word.reenriched);
      router.refresh();
    } else if (!res) {
      toast.error(t.word.connectionLost);
    } else {
      toast.error(t.word.reenrichFailed);
    }
  }

  async function handleDelete() {
    if (!confirm(t.word.confirmDelete)) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("words").delete().eq("id", wordId);
    setBusy(false);
    if (error) {
      toast.error(t.word.deleteFailed);
      return;
    }
    toast.success(t.word.deleted);
    router.push("/dictionary");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <button type="button" onClick={handleReenrich} disabled={busy} className="btn">
        {t.word.reenrich}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="link text-sm text-red disabled:opacity-40"
      >
        {t.word.delete}
      </button>
    </div>
  );
}
