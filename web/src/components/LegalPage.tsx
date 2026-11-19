import { Header } from "@/components/Header";
import { t, type Lang } from "@/lib/i18n";
import { legal, LEGAL_UPDATED, type LegalDoc } from "@/lib/legal";

export function LegalPage({ lang, doc }: { lang: Lang; doc: LegalDoc }) {
  const page = legal(lang, doc);
  return (
    <>
      <Header lang={lang} path={`/${doc}`} />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">{page.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {t(lang).footer.updated}: {LEGAL_UPDATED}
        </p>
        <p className="mt-6 leading-7">{page.intro}</p>
        {page.sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="text-lg font-bold">{s.h}</h2>
            {s.p.map((para) => (
              <p key={para} className="mt-3 leading-7 text-ink/80">{para}</p>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}
