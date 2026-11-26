import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/I18nProvider";
import { getI18n } from "@/lib/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  // latin-ext carries Turkish ğ, ş, ı, İ.
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  // latin-ext carries Turkish ğ, ş, ı, İ.
  subsets: ["latin", "latin-ext"],
});

const playfair = Playfair_Display({
  variable: "--font-serif-display",
  // latin-ext carries Turkish ğ, ş, ı, İ.
  subsets: ["latin", "latin-ext"],
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
      className={`dark ${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#07080a] text-neutral-100 font-sans selection:bg-amber-500/20 selection:text-amber-200">
        <I18nProvider locale={locale}>
          {children}
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}

