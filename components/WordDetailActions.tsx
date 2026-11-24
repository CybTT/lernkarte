"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
    <div className="flex gap-2">
      <Button variant="secondary" onClick={handleReenrich} disabled={busy}>
        {t.word.reenrich}
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={busy}>
        {t.word.delete}
      </Button>
    </div>
  );
}
