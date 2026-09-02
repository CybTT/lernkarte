-- Migration 003: clean terms, usage notes, and multiple meanings
-- Run this in the Supabase SQL editor on an existing project.
-- (schema.sql already contains these changes for a fresh install.)

alter table words
  -- What the user actually typed, kept only when enrichment rewrote `term`
  -- (e.g. they typed the Turkish "araba" and we stored "Auto").
  add column if not exists original_input text,
  -- Set when enrichment could not identify a German word, so the row is
  -- flagged in the UI instead of being filled with invented data.
  add column if not exists needs_review boolean not null default false,
  -- Short Turkish note on how/where the word is used in daily life.
  add column if not exists usage_note text,
  -- Additional Turkish meanings beyond the primary `meaning_tr`.
  add column if not exists meanings_tr text[];

create index if not exists words_user_needs_review_idx
  on words (user_id, needs_review);
