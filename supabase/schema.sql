-- LernKarte schema: profiles, words, reviews
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ============================================================
-- profiles
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  daily_goal  int not null default 20,
  level       text not null default 'B1'
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- words
-- ============================================================
create table if not exists words (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles (id) on delete cascade,
  created_at        timestamptz not null default now(),

  -- raw input
  term              text not null,
  source            text not null default 'manual' check (source in ('manual', 'extension')),
  context_sentence  text,

  -- AI-enriched fields
  enriched          boolean not null default false,
  article           text check (article in ('der', 'die', 'das')),
  plural            text,
  part_of_speech    text,
  meaning_tr        text,
  meaning_en        text,
  ipa               text,
  example_de        text,
  example_tr        text,

  -- verb-specific
  praeteritum       text,
  perfekt           text,
  separable         boolean,
  rektion           text,
  word_family       text[],
  theme             text,

  -- learning state
  mastery           real not null default 0 check (mastery >= 0 and mastery <= 100),
  ease              real not null default 2.5,
  interval_days     real not null default 0,
  next_review       timestamptz not null default now(),
  last_reviewed     timestamptz,
  is_leech          boolean not null default false
);

create index if not exists words_user_next_review_idx on words (user_id, next_review);
create index if not exists words_user_leech_idx on words (user_id, is_leech);

-- ============================================================
-- reviews
-- ============================================================
create table if not exists reviews (
  id              uuid primary key default gen_random_uuid(),
  word_id         uuid not null references words (id) on delete cascade,
  user_id         uuid not null references profiles (id) on delete cascade,
  created_at      timestamptz not null default now(),
  question_type   text not null check (
    question_type in ('match', 'cloze', 'typing', 'translate', 'multiple_choice')
  ),
  correct         boolean not null,
  response_ms     int,
  mastery_before  real,
  mastery_after   real
);

create index if not exists reviews_word_id_idx on reviews (word_id);
create index if not exists reviews_user_id_idx on reviews (user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table words    enable row level security;
alter table reviews  enable row level security;

create policy "profiles: owner select" on profiles
  for select using (id = auth.uid());
create policy "profiles: owner update" on profiles
  for update using (id = auth.uid());
create policy "profiles: owner insert" on profiles
  for insert with check (id = auth.uid());

create policy "words: owner select" on words
  for select using (user_id = auth.uid());
create policy "words: owner insert" on words
  for insert with check (user_id = auth.uid());
create policy "words: owner update" on words
  for update using (user_id = auth.uid());
create policy "words: owner delete" on words
  for delete using (user_id = auth.uid());

create policy "reviews: owner select" on reviews
  for select using (user_id = auth.uid());
create policy "reviews: owner insert" on reviews
  for insert with check (user_id = auth.uid());
