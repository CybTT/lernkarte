"use client";

import { useI18n } from "@/components/I18nProvider";

/** Friendly fallback when a page fails to load (e.g. the connection dropped). */
export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-14 sm:px-6">
      <div role="alert" className="flex flex-col gap-4 border-l-2 border-red pl-5">
        <h1 className="text-3xl font-bold sm:text-4xl">{t.error.title}</h1>
        <p className="max-w-[56ch] text-muted-text">{t.error.body}</p>
        <button onClick={() => retry()} className="btn w-fit">
          {t.common.retry}
        </button>
      </div>
    </main>
  );
}
