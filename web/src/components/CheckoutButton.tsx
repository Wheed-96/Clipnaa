"use client";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

let paddlePromise: Promise<Paddle | undefined> | undefined;
// The button that opened the checkout last receives its events.
let listener: { complete: () => void; error: (msg: string) => void } | undefined;

const ENV = process.env.NEXT_PUBLIC_PADDLE_ENV?.trim() === "production" ? "production" : "sandbox";
const TOKEN = (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "").trim().replace(/^["']|["']$/g, "");

/** Settings mistakes we can spot before Paddle does. These values are public, so showing them is safe. */
function configProblem(priceId?: string): string | null {
  if (!TOKEN) return "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is empty in Vercel.";
  if (ENV === "sandbox" && !TOKEN.startsWith("test_"))
    return `The Paddle client token starts with "${TOKEN.slice(0, 5)}", but sandbox needs a token that starts with "test_".`;
  if (ENV === "production" && !TOKEN.startsWith("live_"))
    return `The Paddle client token starts with "${TOKEN.slice(0, 5)}", but production needs one that starts with "live_".`;
  if (!priceId) return "This plan's NEXT_PUBLIC_PADDLE_PRICE_* variable is empty in Vercel.";
  if (!/^pri_[a-z0-9]+$/.test(priceId)) return `The price ID "${priceId}" doesn't look like a Paddle price ID (pri_...).`;
  return null;
}

function getPaddle() {
  paddlePromise ??= initializePaddle({
    environment: ENV,
    token: TOKEN,
    eventCallback: (e) => {
      if (e.name === "checkout.completed") listener?.complete();
      if (e.name === "checkout.error" || e.type === "error") {
        const msg = [e.code, e.detail].filter(Boolean).join(": ") || "unknown error";
        console.error("Paddle checkout error:", e);
        listener?.error(msg);
      }
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
  const [error, setError] = useState("");
  const priceId = props.priceId?.trim().replace(/^["']|["']$/g, "");

  useEffect(() => {
    getPaddle()
      .then(setPaddle)
      .catch(() => setPaddle(undefined)); // ad blockers or no network: the click explains it
  }, []);

  function open() {
    const problem = configProblem(priceId);
    if (problem) return setError(problem);
    if (!paddle) return setError("Paddle's checkout didn't load. Turn off ad blockers for this site and reload the page.");
    setError("");
    listener = {
      complete: () => {
        setDone(true);
        setTimeout(() => router.refresh(), 4000);
      },
      error: (msg) => setError(`Paddle: ${msg} (price ${priceId}, ${ENV})`),
    };
    paddle.Checkout.open({
      items: [{ priceId: priceId!, quantity: 1 }],
      customer: props.email ? { email: props.email } : undefined,
      customData: { user_id: props.userId },
      settings: { locale: props.lang, displayMode: "overlay" },
    });
  }

  if (done) return <p className="text-sm text-emerald-700">{props.thanks}</p>;

  return (
    <>
      <button
        type="button"
        className={`${props.featured ? "btn-primary" : "btn-ghost"} w-full`}
        onClick={open}
      >
        {props.label}
      </button>
      {error && <p className="mt-2 break-words text-xs text-red-600" dir="ltr">{error}</p>}
    </>
  );
}
