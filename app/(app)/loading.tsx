import { getI18n } from "@/lib/i18n/server";

/**
 * Shown the instant a tab is clicked, while the page is fetched — so a click
 * visibly does something instead of seeming to be ignored.
 */
export default async function Loading() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-14" aria-busy="true">
      <span className="sr-only">{t.common.loading}</span>
      <div className="flex flex-col gap-4 motion-safe:animate-pulse">
        <div className="h-3 w-40 bg-text/10" />
        <div className="h-12 w-full max-w-xl bg-text/10" />
        <div className="h-12 w-3/4 max-w-md bg-text/10" />
        <div className="mt-8 h-px w-full bg-border" />
        <div className="h-24 w-full max-w-2xl bg-text/[0.06]" />
      </div>
    </main>
  );
}
