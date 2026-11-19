import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function Logo({ lang }: { lang: Lang }) {
  return (
    <Link href={`/${lang}`} className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <span className="brand-gradient grid h-8 w-8 place-items-center rounded-lg text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M8 5.5v13l10-6.5z" />
        </svg>
      </span>
      {t(lang).brand}
    </Link>
  );
}

/** Top bar. `signedIn` switches the links between marketing and app. */
export function Header({ lang, signedIn = false, path = "" }: { lang: Lang; signedIn?: boolean; path?: string }) {
  const d = t(lang);
  const other = lang === "ar" ? "en" : "ar";
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo lang={lang} />
        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          {signedIn ? (
            <>
              <Link className="rounded-full px-3 py-2 hover:bg-black/5" href={`/${lang}/dashboard`}>{d.nav.dashboard}</Link>
              <Link className="rounded-full px-3 py-2 hover:bg-black/5" href={`/${lang}/billing`}>{d.nav.billing}</Link>
              <form action="/auth/signout" method="post">
                <input type="hidden" name="lang" value={lang} />
                <button className="rounded-full px-3 py-2 text-muted hover:bg-black/5">{d.nav.logout}</button>
              </form>
            </>
          ) : (
            <>
              <a className="hidden rounded-full px-3 py-2 hover:bg-black/5 sm:block" href={`/${lang}#pricing`}>{d.nav.pricing}</a>
              <Link className="btn-primary" href={`/${lang}/login`}>{d.nav.login}</Link>
            </>
          )}
          <Link className="rounded-full px-3 py-2 text-muted hover:bg-black/5" href={`/${other}${path}`}>{d.nav.switch}</Link>
        </nav>
      </div>
    </header>
  );
}
