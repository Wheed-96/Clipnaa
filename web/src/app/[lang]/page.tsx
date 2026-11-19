import Link from "next/link";
import { lang as rootLang } from "next/root-params";
import { Header } from "@/components/Header";
import { PricingCards } from "@/components/PricingCards";
import { isLang, t, type Lang } from "@/lib/i18n";

export default async function Landing() {
  const l = await rootLang();
  const lang: Lang = isLang(l) ? l : "en";
  const d = t(lang);

  return (
    <>
      <Header lang={lang} />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-ink text-white">
          <div className="pointer-events-none absolute -top-40 start-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                {d.hero.badge}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
                <span className="brand-text">{d.hero.title}</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">{d.hero.sub}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={`/${lang}/login`} className="btn-primary px-7 py-3 text-base">{d.hero.cta}</Link>
                <span className="text-sm text-white/60">{d.hero.note}</span>
              </div>
            </div>
            <PhoneMock lang={lang} />
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-extrabold">{d.how.title}</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.how.steps.map(([title, body], i) => (
              <li key={title} className="card p-6">
                <span className="brand-gradient grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-extrabold">{d.features.title}</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {d.features.items.map(([title, body]) => (
                <div key={title} className="rounded-2xl bg-paper p-6">
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="text-center text-3xl font-extrabold">{d.pricing.title}</h2>
          <p className="mt-3 text-center text-muted">{d.pricing.sub}</p>
          <div className="mt-10">
            <PricingCards
              lang={lang}
              action={(id) => (
                <Link
                  href={`/${lang}/login`}
                  className={`${id === "pro" ? "btn-primary" : "btn-ghost"} w-full`}
                >
                  {id === "free" ? d.pricing.start : d.pricing.choose}
                </Link>
              )}
            />
          </div>
        </section>
      </main>
      <footer className="border-t border-black/5 py-8 text-center text-sm text-muted">
        © 2026 {d.brand}. {d.footer.rights}
      </footer>
    </>
  );
}

/** A phone showing a sample clip with a hook and karaoke subtitle, drawn in CSS. */
function PhoneMock({ lang }: { lang: Lang }) {
  const hook = lang === "ar" ? "محد قالك هالشي" : "Nobody tells you this";
  const words = lang === "ar" ? ["هذا", "اللي", "غيّر", "كل", "شي"] : ["this", "changed", "everything"];
  return (
    <div className="mx-auto w-64 rotate-2 rounded-[2.5rem] border border-white/15 bg-white/5 p-3 shadow-2xl shadow-violet-900/40">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-gradient-to-b from-violet-900 via-fuchsia-800 to-ink">
        <div className="absolute inset-x-0 top-10 flex justify-center">
          <span className="rounded-md bg-white px-3 py-1 text-sm font-bold text-ink">{hook}</span>
        </div>
        <div className="absolute inset-x-0 top-1/3 mx-auto h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute inset-x-0 bottom-24 flex flex-wrap justify-center gap-1 px-4 text-lg font-extrabold">
          {words.map((w, i) => (
            <span key={w} className={i === 1 ? "text-yellow-300" : "text-white"}>{w}</span>
          ))}
        </div>
        <div className="absolute bottom-6 inset-x-4 flex items-center justify-between text-xs text-white/70">
          <span>♥ 48.2K</span>
          <span>↗ 9.1K</span>
          <span className="rounded-full bg-white/15 px-2 py-0.5">92 / 100</span>
        </div>
      </div>
    </div>
  );
}
