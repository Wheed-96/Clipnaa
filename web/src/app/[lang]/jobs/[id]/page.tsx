import Link from "next/link";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { Suspense } from "react";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ClipCard, type Clip } from "@/components/ClipCard";
import { Header } from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { isLang, t, type Lang } from "@/lib/i18n";
import { downloadUrl } from "@/lib/r2";

export default async function JobPage({ params }: PageProps<"/[lang]/jobs/[id]">) {
  const l = await rootLang();
  const lang: Lang = isLang(l) ? l : "en";
  return (
    <>
      <Header lang={lang} signedIn />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <Job lang={lang} params={params} />
        </Suspense>
      </main>
    </>
  );
}

type ProfileSetup = Record<string, string | string[]>;

async function Job({ lang, params }: { lang: Lang; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = t(lang).job;
  const { supabase } = await requireUser(lang);
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (!job) notFound();
  const { data: rows } = await supabase.from("clips").select("*").eq("job_id", id).order("virality_score", { ascending: false });

  const clips: Clip[] = await Promise.all(
    (rows ?? []).map(async (c) => {
      const name = c.file_key.split("/").pop();
      return { ...c, watchUrl: await downloadUrl(c.file_key), downloadUrl: await downloadUrl(c.file_key, name) };
    }),
  );
  const profiles = (job.profiles ?? {}) as Record<string, ProfileSetup | string>;

  return (
    <div className="space-y-8">
      <AutoRefresh active={job.status === "queued" || job.status === "processing"} />
      <Link href={`/${lang}/dashboard`} className="text-sm text-muted hover:text-ink">{lang === "ar" ? "→" : "←"} {d.back}</Link>
      <div>
        <h1 className="text-3xl font-extrabold">{job.title || job.source_name}</h1>
        {job.summary && <p className="mt-2 max-w-3xl text-muted">{job.summary}</p>}
        {job.status !== "done" && <p className="card mt-4 p-4 text-sm">{job.status === "failed" ? job.error : d.working}</p>}
      </div>

      <div className="space-y-6">
        {clips.map((c) => <ClipCard key={c.id} clip={c} lang={lang} />)}
      </div>

      {job.status === "done" && (
        <section className="card p-6">
          <h2 className="text-xl font-extrabold">{d.profile}</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            {(["instagram", "youtube", "tiktok"] as const).map((p) => {
              const prof = profiles[p] as ProfileSetup | undefined;
              if (!prof) return null;
              return (
                <div key={p} className="rounded-xl bg-paper p-4 text-sm">
                  <h3 className="mb-2 font-bold capitalize">{p === "youtube" ? "YouTube" : p === "tiktok" ? "TikTok" : "Instagram"}</h3>
                  <dl className="space-y-2">
                    {Object.entries(prof).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k.replaceAll("_", " ")}</dt>
                        <dd className="whitespace-pre-line">{Array.isArray(v) ? v.join(" · ") : v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
