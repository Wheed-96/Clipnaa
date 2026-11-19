"use client";
import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

type PlatformCopy = {
  instagram: { caption: string; hashtags: string[] };
  youtube: { title: string; description: string; hashtags: string[]; tags: string[] };
  tiktok: { caption: string; hashtags: string[] };
};

export type Clip = {
  id: string;
  idx: number;
  title: string;
  start_sec: number;
  end_sec: number;
  hook_text: string | null;
  why_it_works: string | null;
  virality_score: number | null;
  copy: PlatformCopy;
  watchUrl: string;
  downloadUrl: string;
};

const PLATFORMS = [
  ["instagram", "Instagram"],
  ["youtube", "YouTube"],
  ["tiktok", "TikTok"],
] as const;

export function ClipCard({ clip, lang }: { clip: Clip; lang: Lang }) {
  const d = t(lang).job;
  const [tab, setTab] = useState<(typeof PLATFORMS)[number][0]>("instagram");
  const [copied, setCopied] = useState(false);
  const p = clip.copy[tab];
  const text =
    tab === "youtube"
      ? `${clip.copy.youtube.title}\n\n${clip.copy.youtube.description}\n\n${p.hashtags.join(" ")}`
      : `${(p as PlatformCopy["instagram"]).caption}\n\n${p.hashtags.join(" ")}`;

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="card grid gap-6 p-5 md:grid-cols-[240px_1fr]">
      <div>
        <video src={clip.watchUrl} controls preload="metadata" playsInline className="aspect-[9/16] w-full rounded-xl bg-black" />
        <a href={clip.downloadUrl} className="btn-ghost mt-3 w-full">{d.download}</a>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-bold">{clip.title}</h3>
          {clip.virality_score != null && (
            <span className="brand-gradient rounded-full px-2.5 py-0.5 text-xs font-bold text-white">
              {d.score} {clip.virality_score}/100
            </span>
          )}
          <span className="text-xs text-muted" dir="ltr">{Math.round(clip.end_sec - clip.start_sec)}s</span>
        </div>
        {clip.hook_text && <p className="mt-2 text-sm"><b>{d.hook}:</b> {clip.hook_text}</p>}
        {clip.why_it_works && <p className="mt-1 text-sm text-muted"><b>{d.why}:</b> {clip.why_it_works}</p>}

        <div className="mt-4 flex gap-1 border-b border-black/10">
          {PLATFORMS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === id ? "border-violet-600 text-violet-700" : "border-transparent text-muted"}`}>
              {label}
            </button>
          ))}
        </div>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-paper p-4 font-sans text-sm leading-relaxed">{text}</pre>
        {tab === "youtube" && <p className="mt-2 text-xs text-muted">Tags: {clip.copy.youtube.tags.join(", ")}</p>}
        <button type="button" onClick={copy} className="btn-ghost mt-3">{copied ? d.copied : d.copy}</button>
      </div>
    </article>
  );
}
