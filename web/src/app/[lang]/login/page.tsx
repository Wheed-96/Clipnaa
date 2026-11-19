import { lang as rootLang } from "next/root-params";
import { Header } from "@/components/Header";
import { LoginForm } from "@/components/LoginForm";
import { isLang, t, type Lang } from "@/lib/i18n";

export default async function LoginPage() {
  const l = await rootLang();
  const lang: Lang = isLang(l) ? l : "en";
  const d = t(lang).login;
  return (
    <>
      <Header lang={lang} path="/login" />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="card p-8">
          <h1 className="text-2xl font-extrabold">{d.title}</h1>
          <p className="mt-2 text-sm text-muted">{d.sub}</p>
          <LoginForm lang={lang} />
        </div>
      </main>
    </>
  );
}
