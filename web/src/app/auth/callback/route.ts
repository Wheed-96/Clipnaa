import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Sign-in links land here.
 * - Email links carry `token_hash` (see the email templates in README), verified from our server,
 *   so the visitor's browser never needs to reach Supabase.
 * - Google sign-in carries a one-time `code`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const next = searchParams.get("next") ?? "/en/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/en/dashboard";

  const supabase = await supabaseServer();
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
    console.error("verifyOtp failed:", error.message);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
    console.error("exchangeCodeForSession failed:", error.message);
  }
  const lang = safeNext.split("/")[1] === "ar" ? "ar" : "en";
  return NextResponse.redirect(`${origin}/${lang}/login?error=1`);
}
