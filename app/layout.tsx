import type { Metadata } from "next";
import { Bricolage_Grotesque, Caveat, Fragment_Mono, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/I18nProvider";
import { getI18n } from "@/lib/i18n/server";
import "./globals.css";

// Every font loads latin-ext, which carries Turkish ğ, ş, ı, İ.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
});

const text = Bricolage_Grotesque({
  variable: "--font-text",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
});

const label = Fragment_Mono({
  variable: "--font-label",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

const handwriting = Caveat({
  variable: "--font-handwriting",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
});

const SITE_URL = "https://lernkartee.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(SITE_URL),
    title: t.meta.title,
    description: t.meta.description,
    // Link previews are in English for every audience.
    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: "LernKarte",
      title: "LernKarte — Write a sentence with every German word you learn",
      description:
        "AI-enriched German vocabulary, spaced repetition, and explained feedback on the sentences you write. For Turkish speakers, A1–B1.",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await getI18n();
  return (
    <html
      lang={locale}
      className={`dark ${display.variable} ${text.variable} ${label.variable} ${handwriting.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col selection:bg-red/30">
        <I18nProvider locale={locale}>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}

