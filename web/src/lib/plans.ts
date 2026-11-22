/** Values pasted into Vercel sometimes carry spaces or quotes. */
function clean(v: string | undefined) {
  return v?.trim().replace(/^["']|["']$/g, "") || undefined;
}

export type PlanId = "free" | "creator" | "pro" | "agency";

export type Plan = {
  id: PlanId;
  usd: number;
  sar: number;
  minutes: number;
  maxUploadMb: number;
  /** Paddle price id for the monthly subscription (none for free). */
  priceId?: string;
};

// Paddle price ids come from the Paddle dashboard (Catalog -> Products -> Prices).
export const PLANS: Record<PlanId, Plan> = {
  free: { id: "free", usd: 0, sar: 0, minutes: 30, maxUploadMb: 500 },
  creator: {
    id: "creator", usd: 19, sar: 69, minutes: 200, maxUploadMb: 4096,
    priceId: clean(process.env.NEXT_PUBLIC_PADDLE_PRICE_CREATOR),
  },
  pro: {
    id: "pro", usd: 49, sar: 179, minutes: 600, maxUploadMb: 4096,
    priceId: clean(process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO),
  },
  agency: {
    id: "agency", usd: 129, sar: 479, minutes: 2000, maxUploadMb: 8192,
    priceId: clean(process.env.NEXT_PUBLIC_PADDLE_PRICE_AGENCY),
  },
};

export const PAID_PLANS: PlanId[] = ["creator", "pro", "agency"];

export function planForPriceId(priceId: string | undefined): Plan | undefined {
  if (!priceId) return undefined;
  return PAID_PLANS.map((id) => PLANS[id]).find((p) => p.priceId === priceId);
}
