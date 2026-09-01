export type Article = "der" | "die" | "das";
export type WordSource = "manual" | "extension";
export type QuestionType = "match" | "multiple_choice" | "cloze" | "typing" | "translate";
export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "other";

export interface Profile {
  id: string;
  created_at: string;
  daily_goal: number;
  level: string;
}

export interface Word {
  id: string;
  user_id: string;
  created_at: string;

  term: string;
  source: WordSource;
  context_sentence: string | null;

  enriched: boolean;
  article: Article | null;
  plural: string | null;
  part_of_speech: PartOfSpeech | null;
  meaning_tr: string | null;
  meaning_en: string | null;
  ipa: string | null;
  example_de: string | null;
  example_tr: string | null;

  praeteritum: string | null;
  perfekt: string | null;
  separable: boolean | null;
  rektion: string | null;
  word_family: string[] | null;
  theme: string | null;

  mastery: number;
  ease: number;
  interval_days: number;
  next_review: string;
  last_reviewed: string | null;
  is_leech: boolean;
}

export interface Review {
  id: string;
  word_id: string;
  user_id: string;
  created_at: string;
  question_type: QuestionType;
  correct: boolean;
  response_ms: number | null;
  mastery_before: number | null;
  mastery_after: number | null;
}

export interface StudySessionItem {
  word: Word;
  question_type: QuestionType;
}

export interface EnrichmentResult {
  article: Article | null;
  plural: string | null;
  part_of_speech: PartOfSpeech;
  meaning_tr: string;
  meaning_en: string;
  ipa: string;
  example_de: string;
  example_tr: string;
  praeteritum: string | null;
  perfekt: string | null;
  separable: boolean | null;
  rektion: string | null;
  word_family: string[];
  theme: string;
}
