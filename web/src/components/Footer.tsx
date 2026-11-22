import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import { SUPPORT_EMAIL } from "@/lib/legal";

export function Footer({ lang }: { lang: Lang }) {
  const d = t(lang);
  const link = "hover:text-ink";
  return (
    <footer className="border-t border-black/5 py-8 text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between">
        <span>© 2026 {d.brand}. {d.footer.rights}</span>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link className={link} href={`/${lang}#pricing`}>{d.nav.pricing}</Link>
          <Link className={link} href={`/${lang}/terms`}>{d.footer.terms}</Link>
          <Link className={link} href={`/${lang}/privacy`}>{d.footer.privacy}</Link>
          <Link className={link} href={`/${lang}/refund`}>{d.footer.refund}</Link>
          <a className={link} href={`mailto:${SUPPORT_EMAIL}`} dir="ltr">{SUPPORT_EMAIL}</a>
        </nav>
      </div>
    </footer>
  );
}
