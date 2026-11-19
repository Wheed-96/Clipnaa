import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const lang = form.get("lang") === "ar" ? "ar" : "en";
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL(`/${lang}`, request.url), { status: 303 });
}
