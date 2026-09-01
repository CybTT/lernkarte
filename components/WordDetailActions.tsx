"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function WordDetailActions({ wordId }: { wordId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

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
    const authHeader = await withAuthHeader();
    const res = await fetch("/api/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ word_ids: [wordId], force: true }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("Kelime yeniden zenginleştirildi.");
      router.refresh();
    } else {
      toast.error("Zenginleştirme başarısız oldu.");
    }
  }

  async function handleDelete() {
    if (!confirm("Bu kelimeyi silmek istediğine emin misin?")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("words").delete().eq("id", wordId);
    setBusy(false);
    if (error) {
      toast.error("Silinemedi.");
      return;
    }
    toast.success("Kelime silindi.");
    router.push("/dictionary");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={handleReenrich} disabled={busy}>
        Yeniden zenginleştir
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={busy}>
        Sil
      </Button>
    </div>
  );
}
