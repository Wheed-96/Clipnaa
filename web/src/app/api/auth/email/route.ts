import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Sends the sign-in email from our server, so the visitor's browser never has to reach
 * Supabase directly (some networks block *.supabase.co).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const lang = body.lang === "ar" ? "ar" : "en";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const next = encodeURIComponent(`/${lang}/dashboard`);
  const emailRedirectTo = `${request.nextUrl.origin}/auth/callback?next=${next}`;
  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
    if (!error) return NextResponse.json({ ok: true });
    if (error.status) {
      console.error("signInWithOtp failed:", error.status, error.message);
      return NextResponse.json({ error: "supabase", detail: error.message }, { status: 502 });
    }
    return unreachable(error);
  } catch (err) {
    return unreachable(err);
  }
}

/** No answer from Supabase: almost always a wrong NEXT_PUBLIC_SUPABASE_URL. The host is not a secret. */
function unreachable(err: unknown) {
  let host = "an invalid address";
  try { host = new URL(SUPABASE_URL).host; } catch {}
  console.error(`Could not reach Supabase at ${host}:`, err);
  return NextResponse.json(
    { error: "unreachable", detail: `Could not reach Supabase at ${host}. Check NEXT_PUBLIC_SUPABASE_URL in Vercel.` },
    { status: 502 },
  );
}
