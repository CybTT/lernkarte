"use client";

import { useI18n } from "@/components/I18nProvider";

/** Friendly fallback when a page fails to load (e.g. the connection dropped). */
export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useI18n();
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div
        role="alert"
        className="polkadot-card flex w-full max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center"
      >
        <h1 className="font-display text-2xl font-bold text-white">{t.error.title}</h1>
        <p className="text-sm text-neutral-400">{t.error.body}</p>
        <button
          onClick={() => retry()}
          className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20"
        >
          {t.common.retry}
        </button>
      </div>
    </main>
  );
}
