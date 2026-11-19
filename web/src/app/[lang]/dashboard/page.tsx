import Link from "next/link";
import { lang as rootLang } from "next/root-params";
import { Suspense } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Header } from "@/components/Header";
import { NewJobForm } from "@/components/NewJobForm";
import { requireUser } from "@/lib/auth";
import { isLang, t, type Lang } from "@/lib/i18n";
import { PLANS } from "@/lib/plans";

export default async function DashboardPage() {
  const l = await rootLang();
  const lang: Lang = isLang(l) ? l : "en";
  return (
    <>
      <Header lang={lang} signedIn path="/dashboard" />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Suspense fallback={<div className="card h-64 animate-pulse" />}>
          <Dashboard lang={lang} />
        </Suspense>
      </main>
    </>
  );
}

type JobRow = {
  id: string;
  status: "queued" | "processing" | "done" | "failed";
  progress: string | null;
  title: string | null;
  source_name: string | null;
  error: string | null;
  created_at: string;
};

async function Dashboard({ lang }: { lang: Lang }) {
  const d = t(lang).dash;
  const { supabase, profile } = await requireUser(lang);
  const { data } = await supabase
    .from("jobs")
    .select("id,status,progress,title,source_name,error,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const jobs = (data ?? []) as JobRow[];
  const left = Math.max(0, Math.floor(profile.minutes_quota - Number(profile.minutes_used)));
  const busy = jobs.some((j) => j.status === "queued" || j.status === "processing");

  return (
    <div className="space-y-8">
      <AutoRefresh active={busy} />
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-2xl font-extrabold">{left}</p>
          <p className="text-sm text-muted">{d.minutesLeft} · {t(lang).pricing.plans[profile.plan].name}</p>
        </div>
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-black/5 sm:w-64">
          <div className="brand-gradient h-full" style={{ width: `${Math.min(100, (Number(profile.minutes_used) / profile.minutes_quota) * 100)}%` }} />
        </div>
        {profile.plan !== "agency" && <Link href={`/${lang}/billing`} className="btn-ghost">{d.upgrade}</Link>}
      </div>

      <NewJobForm lang={lang} maxUploadMb={PLANS[profile.plan].maxUploadMb} />

      <section>
        <h2 className="mb-4 text-xl font-extrabold">{d.title}</h2>
        {jobs.length === 0 ? (
          <p className="card p-8 text-center text-muted">{d.empty}</p>
        ) : (
          <ul className="card divide-y divide-black/5">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{j.title || j.source_name || "Video"}</p>
                  <p className="text-xs text-muted">
                    {new Date(j.created_at).toLocaleString(lang === "ar" ? "ar-SA" : "en-GB")}
                    {j.status === "processing" && j.progress ? ` · ${j.progress}` : ""}
                    {j.status === "failed" && j.error ? ` · ${j.error}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill status={j.status} label={d.status[j.status]} />
                  {j.status === "done" && <Link href={`/${lang}/jobs/${j.id}`} className="btn-ghost py-1.5">{d.open}</Link>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status, label }: { status: JobRow["status"]; label: string }) {
  const style = {
    queued: "bg-black/5 text-muted",
    processing: "bg-amber-100 text-amber-800",
    done: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-700",
  }[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}
