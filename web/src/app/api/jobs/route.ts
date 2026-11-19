import { NextResponse, type NextRequest } from "next/server";
import { currentUserId } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const LANGUAGES = ["Arabic", "English", "Arabic and English"];
const FRAMINGS = ["auto", "face", "blur", "crop"];
const clamp = (n: unknown, lo: number, hi: number, dflt: number) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : dflt;

/** Create a job for an uploaded file (or a link) and hand it to the worker. */
export async function POST(request: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  let source: string;
  if (typeof body.sourceKey === "string" && body.sourceKey.startsWith(`uploads/${userId}/`)) {
    source = body.sourceKey;
  } else if (typeof body.sourceUrl === "string" && /^https?:\/\/\S+$/i.test(body.sourceUrl)) {
    source = body.sourceUrl;
  } else {
    return NextResponse.json({ error: "Upload a video or paste a link." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: remaining, error: rpcError } = await admin.rpc("minutes_remaining", { p_user: userId });
  if (rpcError) return NextResponse.json({ error: "Please try again." }, { status: 500 });
  if (Number(remaining) < 1) {
    return NextResponse.json({ error: "You've used all your minutes this month. Upgrade to continue." }, { status: 402 });
  }

  const minLen = clamp(body.minLen, 10, 170, 20);
  const { data: job, error } = await admin
    .from("jobs")
    .insert({
      user_id: userId,
      source_key: source,
      source_name: typeof body.sourceName === "string" ? body.sourceName.slice(0, 200) : null,
      num_clips: clamp(body.numClips, 1, 10, 5),
      min_len: minLen,
      max_len: Math.max(minLen + 5, clamp(body.maxLen, 15, 180, 60)),
      caption_language: LANGUAGES.includes(body.language) ? body.language : "Arabic",
      reframe: FRAMINGS.includes(body.reframe) ? body.reframe : "auto",
      brief: typeof body.brief === "string" ? body.brief.slice(0, 1000) : "",
    })
    .select("id")
    .single();
  if (error || !job) return NextResponse.json({ error: "Could not create the job." }, { status: 500 });

  const res = await fetch(process.env.WORKER_URL!, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ job_id: job.id, secret: process.env.WORKER_SECRET }),
  }).catch(() => null);
  if (!res?.ok) {
    await admin.from("jobs").update({ status: "failed", error: "Could not start processing. Please try again." }).eq("id", job.id);
    return NextResponse.json({ error: "Could not start processing. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ id: job.id });
}
