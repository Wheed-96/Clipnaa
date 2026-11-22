import type { Metadata } from "next";
import { lang as rootLang } from "next/root-params";
import { LegalPage } from "@/components/LegalPage";
import { isLang, type Lang } from "@/lib/i18n";
import { legal } from "@/lib/legal";

async function currentLang(): Promise<Lang> {
  const l = await rootLang();
  return isLang(l) ? l : "en";
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${legal(await currentLang(), "refund").title} | Clipnaa` };
}

export default async function Page() {
  return <LegalPage lang={await currentLang()} doc="refund" />;
}
