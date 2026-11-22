import { NextResponse, type NextRequest } from "next/server";
import { verifyPaddleSignature } from "@/lib/paddle";
import { PLANS, planForPriceId } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/server";

type Subscription = {
  id: string;
  status: string; // active | trialing | past_due | paused | canceled
  customer_id: string;
  custom_data?: { user_id?: string } | null;
  items: { price: { id: string } }[];
  current_billing_period?: { starts_at: string; ends_at: string } | null;
  management_urls?: { update_payment_method?: string | null; cancel?: string | null } | null;
};

/** Paddle tells us about subscription changes here. Set this URL in Paddle -> Notifications. */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const ok = verifyPaddleSignature(raw, request.headers.get("paddle-signature"), (process.env.PADDLE_WEBHOOK_SECRET ?? "").trim());
  if (!ok) {
    console.error("Paddle webhook: bad signature. Check PADDLE_WEBHOOK_SECRET matches the notification destination's secret key.");
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  const event = JSON.parse(raw) as { event_type: string; data: Subscription };
  if (!event.event_type.startsWith("subscription.")) return NextResponse.json({ ok: true });

  const sub = event.data;
  const admin = supabaseAdmin();
  const userId = sub.custom_data?.user_id;
  const query = admin.from("profiles").select("id, period_start, paddle_subscription_id");
  const { data: profile } = userId
    ? await query.eq("id", userId).maybeSingle()
    : await query.eq("paddle_subscription_id", sub.id).maybeSingle();
  if (!profile) {
    console.error("Paddle webhook: no matching user for", userId ?? sub.id);
    return NextResponse.json({ ok: true, note: "no matching user" });
  }

  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const plan = active ? planForPriceId(sub.items[0]?.price.id) ?? PLANS.free : PLANS.free;
  const periodStart = sub.current_billing_period?.starts_at;
  const newPeriod = periodStart && new Date(periodStart) > new Date(profile.period_start);

  const { error } = await admin
    .from("profiles")
    .update({
      plan: plan.id,
      minutes_quota: plan.minutes,
      subscription_status: sub.status,
      paddle_customer_id: sub.customer_id,
      paddle_subscription_id: sub.id,
      billing_manage_url: sub.management_urls?.update_payment_method ?? null,
      billing_cancel_url: sub.management_urls?.cancel ?? null,
      // A renewal starts a fresh month of minutes.
      ...(newPeriod ? { period_start: periodStart, minutes_used: 0 } : {}),
    })
    .eq("id", profile.id);
  if (error) {
    console.error("Paddle webhook: profile update failed:", error.message);
    return NextResponse.json({ error: "update failed" }, { status: 500 }); // Paddle retries
  }
  if (plan.id === "free" && active) console.error("Paddle webhook: unknown price", sub.items[0]?.price.id);
  return NextResponse.json({ ok: true });
}
