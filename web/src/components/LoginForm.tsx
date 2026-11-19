"use client";
import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export function LoginForm({ lang }: { lang: Lang }) {
  const d = t(lang).login;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  // Both sign-in methods go through our own server, so the browser never calls Supabase directly.
  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error === "invalid_email" ? d.invalid : (body.detail ?? d.failed));
      setState("sent");
    } catch (err) {
      setError(err instanceof Error && err.message !== "Failed to fetch" ? err.message : d.failed);
      setState("error");
    }
  }

  if (state === "sent") {
    return <p className="mt-6 rounded-xl bg-violet-50 p-4 text-sm text-violet-900">{d.sent}</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      {/* A plain link: /auth/google is a server route, not a page. */}
      <a href={`/auth/google?lang=${lang}`} className="btn-ghost w-full">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.8 3.3-8.1z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.4 9.1 5.4 12 5.4z" />
        </svg>
        {d.google}
      </a>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-black/10" />
        {d.or}
        <span className="h-px flex-1 bg-black/10" />
      </div>
      <form onSubmit={sendLink} className="space-y-3">
        <label className="label" htmlFor="email">{d.email}</label>
        <input id="email" type="email" required dir="ltr" className="field" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <button className="btn-primary w-full" disabled={state === "sending"}>{d.send}</button>
        {state === "error" && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
