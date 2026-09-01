"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SpeakButton({ text, className }: { text: string; className?: string }) {
  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={speak}
      aria-label="Telaffuzu dinle"
    >
      <Volume2 className="size-4" />
    </Button>
  );
}
