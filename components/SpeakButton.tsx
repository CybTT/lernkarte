"use client";

import { Volume2 } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

/** Reads German text aloud with the browser's speech synthesis. */
export function SpeakButton({ text, className }: { text: string; className?: string }) {
  const { t } = useI18n();

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={t.word.speak}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] text-current opacity-60 transition-opacity hover:opacity-100",
        className
      )}
    >
      <Volume2 className="h-4 w-4" />
    </button>
  );
}
