import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/** Starts Google sign-in from the server and sends the visitor on to Google. */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`/${lang}/dashboard`)}`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return NextResponse.redirect(`${origin}/${lang}/login?error=google`);
  return NextResponse.redirect(data.url);
}
