import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

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
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
  return { supabase, user: data.user, profile: profile as Profile };
}

/** For route handlers: the user id, or null when signed out. */
export async function currentUserId(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
