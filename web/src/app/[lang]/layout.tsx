import type { Metadata } from "next";
import { lang } from "next/root-params";
import { isLang, LANGS, t } from "@/lib/i18n";
import "../globals.css";

export function generateStaticParams() {
  return LANGS.map((l) => ({ lang: l }));
}

export async function generateMetadata(): Promise<Metadata> {
  const l = await lang();
  const d = t(isLang(l) ? l : "en");
  return {
    title: `${d.brand}: ${d.hero.title}`,
    description: d.hero.sub,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const l = await lang();
  const current = isLang(l) ? l : "en";
  return (
    <html lang={current} dir={t(current).dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
