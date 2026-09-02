-- Migration 002: shared reference wordlist + flashcard question type
-- Run this in the Supabase SQL editor on an existing project.
-- (schema.sql already contains these changes for a fresh install.)

-- ============================================================
-- dictionary_pool: shared, read-only A1-B1 reference wordlist.
-- Source: Goethe-Institut A1/A2/B1 Wortliste. Used only to draw
-- multiple-choice distractors — separate from each user's `words`.
-- ============================================================
create table if not exists dictionary_pool (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  term            text not null unique,
  article         text check (article in ('der', 'die', 'das')),
  plural_hint     text,
  part_of_speech  text not null check (
    part_of_speech in ('noun', 'verb', 'adjective', 'other')
  ),
  level           text not null check (level in ('A1', 'A2', 'B1')),
  example_de      text
);

create index if not exists dictionary_pool_pos_level_idx
  on dictionary_pool (part_of_speech, level);

alter table dictionary_pool enable row level security;

-- Shared reference data: every signed-in user may read it, nobody may
-- write it. The seed script uses the service role, which bypasses RLS.
drop policy if exists "dictionary_pool: authenticated read" on dictionary_pool;
create policy "dictionary_pool: authenticated read" on dictionary_pool
  for select to authenticated using (true);

-- ============================================================
-- reviews.question_type: allow 'flashcard' (Flashcard study mode)
-- ============================================================
alter table reviews drop constraint if exists reviews_question_type_check;
alter table reviews add constraint reviews_question_type_check check (
  question_type in ('match', 'cloze', 'typing', 'translate', 'multiple_choice', 'flashcard')
);
