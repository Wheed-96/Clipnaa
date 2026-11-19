import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Email links and Google sign-in land here with a one-time code. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/en/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/en/dashboard";

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  const lang = safeNext.split("/")[1] === "ar" ? "ar" : "en";
  return NextResponse.redirect(`${origin}/${lang}/login?error=1`);
}
