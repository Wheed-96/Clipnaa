"use client";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

let paddlePromise: Promise<Paddle | undefined> | undefined;

function getPaddle(onComplete: () => void) {
  paddlePromise ??= initializePaddle({
    environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox",
    token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    eventCallback: (e) => {
      if (e.name === "checkout.completed") onComplete();
    },
  });
  return paddlePromise;
}

/** Opens Paddle's checkout overlay. The user id travels as custom data so the webhook can match it. */
export function CheckoutButton(props: {
  priceId?: string;
  userId: string;
  email?: string;
  lang: "ar" | "en";
  label: string;
  thanks: string;
  featured?: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    getPaddle(() => {
      setDone(true);
      setTimeout(() => router.refresh(), 4000);
    })
      .then(setPaddle)
      .catch(() => setPaddle(undefined)); // ad blockers or no network: button stays disabled
  }, [router]);

  if (done) return <p className="text-sm text-emerald-700">{props.thanks}</p>;

  return (
    <button
      type="button"
      className={`${props.featured ? "btn-primary" : "btn-ghost"} w-full`}
      disabled={!paddle || !props.priceId}
      onClick={() =>
        paddle?.Checkout.open({
          items: [{ priceId: props.priceId!, quantity: 1 }],
          customer: props.email ? { email: props.email } : undefined,
          customData: { user_id: props.userId },
          settings: { locale: props.lang, displayMode: "overlay" },
        })
      }
    >
      {props.label}
    </button>
  );
}
