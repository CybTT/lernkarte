import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-5 px-5 py-24 sm:px-8">
      <p className="hand text-4xl text-red">404</p>
      <h1 className="font-display text-4xl font-bold sm:text-6xl">{t.notFound.title}</h1>
      <p className="max-w-[50ch] text-muted-text">{t.notFound.body}</p>
      <Link
        href="/"
        className="link w-fit text-sm"
      >
        {t.notFound.home}
      </Link>
    </main>
  );
}
