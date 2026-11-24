import { getI18n } from "@/lib/i18n/server";

/**
 * Shown the instant a tab is clicked, while the page is fetched — so a click
 * visibly does something instead of seeming to be ignored.
 */
export default async function Loading() {
  const { t } = await getI18n();
  return (
    <main
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-8 px-6 py-12"
      aria-busy="true"
    >
      <span className="sr-only">{t.common.loading}</span>
      <div className="h-10 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="h-40 w-full max-w-2xl animate-pulse rounded-2xl bg-white/5" />
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    </main>
  );
}
