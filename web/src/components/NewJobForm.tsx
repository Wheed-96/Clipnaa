"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

const LANGUAGES = ["Arabic", "English", "Arabic and English"] as const;
const FRAMINGS = ["auto", "face", "blur", "crop"] as const;

export function NewJobForm({ lang, maxUploadMb }: { lang: Lang; maxUploadMb: number }) {
  const d = t(lang).dash;
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [numClips, setNumClips] = useState(5);
  const [minLen, setMinLen] = useState(20);
  const [maxLen, setMaxLen] = useState(60);
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>(lang === "ar" ? "Arabic" : "English");
  const [reframe, setReframe] = useState<(typeof FRAMINGS)[number]>("auto");
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      let sourceKey: string | undefined;
      if (file) {
        if (file.size > maxUploadMb * 1024 * 1024) throw new Error(`Max ${maxUploadMb} MB on your plan.`);
        setBusy(`${d.uploading} 0%`);
        const res = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ filename: file.name, size: file.size, type: file.type || "video/mp4" }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Upload failed");
        await put(body.url, file, file.type || "video/mp4", (p) => setBusy(`${d.uploading} ${p}%`));
        sourceKey = body.key;
      }
      setBusy(d.starting);
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sourceKey,
          sourceUrl: file ? undefined : link.trim(),
          sourceName: file?.name ?? link.trim(),
          numClips, minLen, maxLen, language, reframe, brief,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not start");
      setFile(null);
      setLink("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6">
      <h2 className="text-xl font-extrabold">{d.newTitle}</h2>
      <div>
        <label className="label" htmlFor="file">{d.file}</label>
        <input id="file" type="file" accept="video/*" className="field file:me-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-3 file:py-1 file:text-violet-700"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <input type="url" dir="ltr" className="field mt-2" placeholder="https://" value={link}
          disabled={!!file} onChange={(e) => setLink(e.target.value)} aria-label={d.orLink} />
        <p className="mt-1 text-xs text-muted">{d.orLink}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="n">{d.clips}</label>
          <input id="n" type="number" min={1} max={10} className="field" value={numClips} onChange={(e) => setNumClips(+e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="len">{d.length}</label>
          <div className="flex items-center gap-2" dir="ltr">
            <input id="len" type="number" min={10} max={180} className="field" value={minLen} onChange={(e) => setMinLen(+e.target.value)} />
            <span className="text-muted">–</span>
            <input type="number" min={15} max={180} className="field" value={maxLen} onChange={(e) => setMaxLen(+e.target.value)} aria-label="max" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="lang">{d.language}</label>
          <select id="lang" className="field" value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{d.languages[l]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="frame">{d.framing}</label>
          <select id="frame" className="field" value={reframe} onChange={(e) => setReframe(e.target.value as typeof reframe)}>
            {FRAMINGS.map((f) => <option key={f} value={f}>{d.framings[f]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="brief">{d.brief}</label>
        <textarea id="brief" rows={2} className="field" placeholder={d.briefPh} value={brief} onChange={(e) => setBrief(e.target.value)} />
      </div>
      <div className="flex items-center gap-4">
        <button className="btn-primary" disabled={!!busy || (!file && !link.trim())}>{busy ?? d.submit}</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}

/** PUT the file straight to storage, reporting progress. */
function put(url: string, file: File, type: string, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed, check your connection"));
    xhr.send(file);
  });
}
