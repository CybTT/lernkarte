-- Migration 004: "Cümle Kur" (sentence building) practice
-- Run this in the Supabase SQL editor on an existing project.
-- (schema.sql already contains these changes for a fresh install.)
--
-- Additive only: one new table, and one more allowed value for
-- reviews.question_type. No existing rows are changed or removed.

-- ============================================================
-- reviews.question_type: allow 'sentence' (a word used in a sentence)
-- ============================================================
alter table reviews drop constraint if exists reviews_question_type_check;
alter table reviews add constraint reviews_question_type_check check (
  question_type in ('match', 'cloze', 'typing', 'translate', 'multiple_choice', 'flashcard', 'sentence')
);

-- ============================================================
-- sentence_attempts: every sentence the learner wrote and Claude's feedback
-- ============================================================
create table if not exists sentence_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  -- Groups the first try and the optional second try of one task.
  task_id       uuid not null,
  attempt_no    smallint not null check (attempt_no in (1, 2)),
  word_ids      uuid[] not null,
  context       text not null,
  grammar_goal  text,
  sentence      text not null,
  verdict       text not null check (verdict in ('correct', 'minor', 'major')),
  -- Error categories found, for the statistics screen.
  error_types   text[] not null default '{}',
  feedback      jsonb not null
);

create index if not exists sentence_attempts_user_created_idx
  on sentence_attempts (user_id, created_at desc);

alter table sentence_attempts enable row level security;

drop policy if exists "sentence_attempts: owner select" on sentence_attempts;
create policy "sentence_attempts: owner select" on sentence_attempts
  for select using (user_id = auth.uid());

drop policy if exists "sentence_attempts: owner insert" on sentence_attempts;
create policy "sentence_attempts: owner insert" on sentence_attempts
  for insert with check (user_id = auth.uid());
