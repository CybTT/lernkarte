import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Review, Word } from "@/lib/types";
import { ArticleBadge } from "@/components/ArticleBadge";
import { SpeakButton } from "@/components/SpeakButton";
import { MasteryBar } from "@/components/MasteryBar";
import { MeaningWithVariants } from "@/components/MeaningWithVariants";
import { WordDetailActions } from "@/components/WordDetailActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: word } = await supabase
    .from("words")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!word) notFound();
  const w = word as Word;

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("word_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-3xl font-semibold">
          <ArticleBadge article={w.article} />
          <span>{w.term}</span>
          <SpeakButton text={w.term} />
        </div>
        <WordDetailActions wordId={w.id} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {w.needs_review && <Badge variant="destructive">tanınmadı</Badge>}
        {!w.enriched && !w.needs_review && <Badge variant="outline">işlenmemiş</Badge>}
        {w.original_input && (
          <span className="text-xs text-muted-foreground">
            girdin: &ldquo;{w.original_input}&rdquo; → {w.term}
          </span>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4">
          {/* Article -> word -> pronunciation -> meaning -> usage, matching the dictionary row. */}
          <div className="flex flex-col gap-1">
            {w.ipa && <p className="font-mono text-sm text-muted-foreground">[{w.ipa}]</p>}
            <p className="text-lg">
              <MeaningWithVariants meaning={w.meaning_tr} others={w.meanings_tr} />
            </p>
            {w.usage_note && <p className="text-sm text-muted-foreground">{w.usage_note}</p>}
          </div>

          <div className="flex items-center gap-2">
            <MasteryBar mastery={w.mastery} className="flex-1" />
            <span className="text-sm text-muted-foreground">{Math.round(w.mastery)}/100</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <Field label="Çoğul" value={w.plural} />
            <Field label="Tür" value={w.part_of_speech} />
            <Field label="İngilizce" value={w.meaning_en} />
            <Field label="Präteritum" value={w.praeteritum} />
            <Field label="Perfekt" value={w.perfekt} />
            <Field label="Rektion" value={w.rektion} />
            <Field label="Ayrılabilir" value={w.separable == null ? null : w.separable ? "evet" : "hayır"} />
          </div>
          {w.word_family && w.word_family.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {w.word_family.map((fw) => (
                <Badge key={fw} variant="secondary">
                  {fw}
                </Badge>
              ))}
            </div>
          )}
          {w.example_de && (
            <div className="mt-1 flex items-start gap-2 rounded-md bg-secondary p-3 text-sm">
              <div className="flex-1">
                <p>{w.example_de}</p>
                {w.example_tr && <p className="text-muted-foreground">{w.example_tr}</p>}
              </div>
              <SpeakButton text={w.example_de} />
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-lg font-medium">Tekrar geçmişi</h2>
        {reviews && reviews.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Sonuç</TableHead>
                <TableHead>Ustalık</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reviews as Review[]).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell>{r.question_type}</TableCell>
                  <TableCell>
                    {r.correct ? (
                      <span className="text-article-das">doğru</span>
                    ) : (
                      <span className="text-article-die">yanlış</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.mastery_before != null && r.mastery_after != null
                      ? `${Math.round(r.mastery_before)} → ${Math.round(r.mastery_after)}`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">Henüz tekrar yok.</p>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}
