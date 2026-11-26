import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-5 px-5 py-24 sm:px-8">
      <p className="font-mono text-sm text-[#e2462c]">404</p>
      <h1 className="font-display text-4xl font-bold sm:text-6xl">{t.notFound.title}</h1>
      <p className="max-w-[50ch] text-neutral-400">{t.notFound.body}</p>
      <Link
        href="/"
        className="w-fit rounded-[3px] text-sm underline decoration-white/30 underline-offset-4 hover:decoration-white"
      >
        {t.notFound.home}
      </Link>
    </main>
  );
}
