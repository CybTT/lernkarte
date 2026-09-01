"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Word } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MasteryBar } from "@/components/MasteryBar";
import { ArticleBadge } from "@/components/ArticleBadge";
import { AddWordForm } from "@/components/AddWordForm";

const LEARNED_THRESHOLD = 85;

function WordRow({ word }: { word: Word }) {
  return (
    <TableRow key={word.id} className="group">
      <TableCell className="w-0 whitespace-nowrap">
        <ArticleBadge article={word.article} />
      </TableCell>
      <TableCell className="font-medium">
        <Link href={`/word/${word.id}`} className="hover:underline">
          {word.term}
        </Link>
        {!word.enriched && (
          <Badge variant="outline" className="ml-2 align-middle text-xs">
            işlenmemiş
          </Badge>
        )}
        {word.is_leech && (
          <Badge variant="destructive" className="ml-2 align-middle text-xs">
            zayıf
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground hidden sm:table-cell">
        {word.meaning_tr ?? "—"}
      </TableCell>
      <TableCell className="w-32">
        <MasteryBar mastery={word.mastery} />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {word.theme && <Badge variant="secondary">{word.theme}</Badge>}
      </TableCell>
    </TableRow>
  );
}

function WordTable({ words }: { words: Word[] }) {
  if (words.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Burada henüz kelime yok.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-0">Artikel</TableHead>
          <TableHead>Kelime</TableHead>
          <TableHead className="hidden sm:table-cell">Anlam</TableHead>
          <TableHead>Ustalık</TableHead>
          <TableHead className="hidden md:table-cell">Tema</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {words.map((w) => (
          <WordRow key={w.id} word={w} />
        ))}
      </TableBody>
    </Table>
  );
}

function ThemeGroups({ words }: { words: Word[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const w of words) {
      const key = w.theme ?? "Diğer";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [words]);

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Henüz temalanmış kelime yok.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map(([theme, items]) => (
        <details key={theme} className="rounded-lg border border-border" open={groups.length <= 3}>
          <summary className="cursor-pointer select-none px-4 py-3 font-medium flex items-center justify-between">
            <span>{theme}</span>
            <span className="text-sm text-muted-foreground">{items.length} kelime</span>
          </summary>
          <div className="px-2 pb-2">
            <WordTable words={items} />
          </div>
        </details>
      ))}
    </div>
  );
}

export function DictionaryView({ words, initialTab = "all" }: { words: Word[]; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);

  const leeches = words.filter((w) => w.is_leech);
  const learning = words.filter((w) => !w.is_leech && w.mastery < LEARNED_THRESHOLD);
  const mastered = words.filter((w) => w.mastery >= LEARNED_THRESHOLD);

  return (
    <div className="flex flex-col gap-6">
      <AddWordForm />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Tümü ({words.length})</TabsTrigger>
          <TabsTrigger value="leeches">Zayıflar ({leeches.length})</TabsTrigger>
          <TabsTrigger value="learning">Öğrenilmekte ({learning.length})</TabsTrigger>
          <TabsTrigger value="mastered">Öğrenilmiş ({mastered.length})</TabsTrigger>
          <TabsTrigger value="theme">Tema</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <WordTable words={words} />
        </TabsContent>
        <TabsContent value="leeches">
          <WordTable words={leeches} />
        </TabsContent>
        <TabsContent value="learning">
          <WordTable words={learning} />
        </TabsContent>
        <TabsContent value="mastered">
          <WordTable words={mastered} />
        </TabsContent>
        <TabsContent value="theme">
          <ThemeGroups words={words} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
