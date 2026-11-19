/**
 * Supabase settings, cleaned up so common copy-paste slips still work:
 * extra spaces or quotes, a missing "https://", or a path copied along with the address
 * (for example ".../rest/v1/" from the Data API page, which Supabase rejects with
 * "Invalid path specified in request URL").
 */
function clean(value: string | undefined) {
  return (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

export function normalizeSupabaseUrl(value: string | undefined) {
  const raw = clean(value);
  if (!raw) return raw;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin;
  } catch {
    return raw;
  }
}

export const SUPABASE_URL = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
