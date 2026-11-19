import { lang as rootLang } from "next/root-params";
import { Suspense } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { Header } from "@/components/Header";
import { PricingCards } from "@/components/PricingCards";
import { requireUser } from "@/lib/auth";
import { isLang, t, type Lang } from "@/lib/i18n";
import { PLANS } from "@/lib/plans";

export default async function BillingPage() {
  const l = await rootLang();
  const lang: Lang = isLang(l) ? l : "en";
  return (
    <>
      <Header lang={lang} signedIn path="/billing" />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <Billing lang={lang} />
        </Suspense>
      </main>
    </>
  );
}

async function Billing({ lang }: { lang: Lang }) {
  const d = t(lang);
  const { user, profile } = await requireUser(lang);
  const paid = profile.plan !== "free";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">{d.billing.title}</h1>
      <div className="card flex flex-wrap items-center gap-8 p-6">
        <div>
          <p className="text-sm text-muted">{d.billing.plan}</p>
          <p className="text-xl font-bold">{d.pricing.plans[profile.plan].name}</p>
        </div>
        <div>
          <p className="text-sm text-muted">{d.billing.usage}</p>
          <p className="text-xl font-bold" dir="ltr">{Math.round(Number(profile.minutes_used))} / {profile.minutes_quota} min</p>
        </div>
        {paid && (
          <div className="ms-auto flex flex-wrap gap-2">
            {profile.billing_manage_url && <a className="btn-ghost" href={profile.billing_manage_url}>{d.billing.manage}</a>}
            {profile.billing_cancel_url && <a className="btn-ghost text-red-600" href={profile.billing_cancel_url}>{d.billing.cancel}</a>}
          </div>
        )}
      </div>
      <PricingCards
        lang={lang}
        action={(id) =>
          id === profile.plan ? (
            <span className="btn-ghost w-full cursor-default opacity-60">{d.pricing.current}</span>
          ) : id === "free" ? null : (
            <CheckoutButton
              priceId={PLANS[id].priceId}
              userId={user.id}
              email={user.email ?? undefined}
              lang={lang}
              label={d.pricing.choose}
              thanks={d.billing.thanks}
              featured={id === "pro"}
            />
          )
        }
      />
    </div>
  );
}
