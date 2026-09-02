"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function stripLeadingArticle(term: string): string {
  return term.replace(/^(der|die|das)\s+/i, "").trim();
}

export function AddWordForm() {
  const [term, setTerm] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = stripLeadingArticle(term.trim());
    if (!cleaned) return;

    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Önce giriş yapmalısın.");
      setBusy(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("words")
      .insert({ term: cleaned, user_id: user.id, source: "manual" })
      .select("id")
      .single();

    if (error || !inserted) {
      toast.error("Kelime eklenemedi.");
      setBusy(false);
      return;
    }

    setTerm("");
    setBusy(false);
    toast.success(`"${cleaned}" eklendi, zenginleştiriliyor…`);
    router.refresh();

    const {
      data: { session },
    } = await supabase.auth.getSession();

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
          toast.error(`"${cleaned}" zenginleştirilemedi.`);
          return;
        }
        const data = await res.json().catch(() => null);
        const report = data?.results?.[0];
        router.refresh();

        if (report?.needs_review) {
          toast.error(`"${cleaned}" bir Almanca kelime olarak tanınmadı — sözlükten düzeltebilirsin.`);
        } else if (report?.corrected) {
          // The user typed Turkish (or an inflected form); say what we stored.
          toast.success(`"${cleaned}" → ${report.term} olarak kaydedildi.`);
        } else {
          toast.success(`"${report?.term ?? cleaned}" zenginleştirildi.`);
        }
      })
      .catch(() => toast.error(`"${cleaned}" zenginleştirilemedi.`));
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Kelime ekle (örn. Haus)"
        disabled={busy}
      />
      <Button type="submit" disabled={busy || !term.trim()}>
        Ekle
      </Button>
    </form>
  );
}
