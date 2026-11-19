import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { PLANS, type PlanId } from "@/lib/plans";

const ORDER: PlanId[] = ["free", "creator", "pro", "agency"];

/** Pricing grid. `action(planId)` renders the button for each plan. */
export function PricingCards({ lang, action }: { lang: Lang; action: (id: PlanId) => ReactNode }) {
  const d = t(lang).pricing;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ORDER.map((id) => {
        const plan = PLANS[id];
        const copy = d.plans[id];
        const featured = id === "pro";
        return (
          <div
            key={id}
            className={`card flex flex-col p-6 ${featured ? "ring-2 ring-violet-500" : ""}`}
          >
            <h3 className="text-lg font-bold">{copy.name}</h3>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">
                {lang === "ar" ? `${plan.sar} ر.س` : `$${plan.usd}`}
              </span>
              <span className="text-sm text-muted">{d.month}</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {lang === "ar" ? `$${plan.usd}` : `SAR ${plan.sar}`}
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {copy.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-violet-600">✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6">{action(id)}</div>
          </div>
        );
      })}
    </div>
  );
}
