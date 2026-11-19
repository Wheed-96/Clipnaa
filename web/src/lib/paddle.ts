import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Paddle Billing webhook. Header format: "ts=1700000000;h1=<hex hmac>".
 * The signed payload is `${ts}:${rawBody}`, HMAC-SHA256 with the endpoint's secret key.
 */
export function verifyPaddleSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  maxAgeSeconds = 300,
  now = Math.floor(Date.now() / 1000),
): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(";").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const ts = Number(parts.ts);
  if (!ts || !parts.h1 || Math.abs(now - ts) > maxAgeSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(parts.h1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
