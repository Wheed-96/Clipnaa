import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  plan: "free" | "creator" | "pro" | "agency";
  minutes_quota: number;
  minutes_used: number;
  period_start: string;
  subscription_status: string | null;
  billing_manage_url: string | null;
  billing_cancel_url: string | null;
};

/** The signed-in user and their profile, or a redirect to the login page. */
export async function requireUser(lang: string) {
  await connection(); // per-request data: never prerendered
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${lang}/login`);
  const user = data.user;
  const { data: found, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  let profile = found as Profile | null;
  if (error) console.error("profiles select failed:", error.message);
  if (!profile && !error) {
    // Accounts created before the database trigger existed have no profile row: create it now.
    try {
      const created = await supabaseAdmin()
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? null }, { onConflict: "id" })
        .select("*")
        .single();
      if (created.error) console.error("profile create failed:", created.error.message);
      profile = created.data as Profile | null;
    } catch (err) {
      console.error("profile create failed:", err);
    }
  }
  // Never crash the page over a missing row: fall back to the free plan.
  const safe: Profile = profile ?? {
    id: user.id,
    email: user.email ?? null,
    plan: "free",
    minutes_quota: 30,
    minutes_used: 0,
    period_start: new Date().toISOString(),
    subscription_status: null,
    billing_manage_url: null,
    billing_cancel_url: null,
  };
  return { supabase, user, profile: safe };
}

/** For route handlers: the user id, or null when signed out. */
export async function currentUserId(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
